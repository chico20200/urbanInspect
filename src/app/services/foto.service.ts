import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraErrorCode } from '@capacitor/camera';
import { CONFIG } from '../config';

export type ResultadoFoto =
  | { estado: 'ok'; webPath: string }
  | { estado: 'cancelada' }
  | { estado: 'sin-permiso' }
  | { estado: 'error'; mensaje: string };

@Injectable({ providedIn: 'root' })
export class FotoService {
  /** R6: toma una foto. Nunca lanza excepción: devuelve qué pasó para que el formulario decida. */
  async tomar(): Promise<ResultadoFoto> {
    try {
      if (Capacitor.isNativePlatform()) {
        let permiso = await Camera.checkPermissions();
        if (permiso.camera !== 'granted') {
          permiso = await Camera.requestPermissions({ permissions: ['camera'] });
        }
        if (permiso.camera === 'denied') return { estado: 'sin-permiso' };
      }
      const foto = await Camera.takePhoto({
        quality: 60, // menos peso para subirla desde campo
        targetWidth: 1280,
        targetHeight: 1280,
        correctOrientation: true,
        webUseInput: true, // en el navegador usa un selector de archivo (para pruebas con ionic serve)
      });
      if (!foto.webPath) return { estado: 'error', mensaje: 'La cámara no devolvió la imagen.' };
      return { estado: 'ok', webPath: foto.webPath };
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      const msg = (e as { message?: string })?.message ?? '';
      if (code === CameraErrorCode.TakePhotoCancelled || /cancel/i.test(msg)) {
        return { estado: 'cancelada' };
      }
      if (code === CameraErrorCode.CameraPermissionDenied || /denied|permission/i.test(msg)) {
        return { estado: 'sin-permiso' };
      }
      return { estado: 'error', mensaje: msg || 'No se pudo tomar la foto.' };
    }
  }

  /** Sube la foto a Cloudinary y devuelve su URL pública (la que se guarda en MockAPI). */
  async subir(webPath: string): Promise<string> {
    const blob = await (await fetch(webPath)).blob();
    const form = new FormData();
    form.append('file', blob, 'incidencia.jpg');
    form.append('upload_preset', CONFIG.cloudinaryUploadPreset);
    const url = `https://api.cloudinary.com/v1_1/${CONFIG.cloudinaryCloudName}/image/upload`;
    const resp = await fetch(url, { method: 'POST', body: form });
    if (!resp.ok) throw new Error(`No se pudo subir la foto (HTTP ${resp.status}).`);
    const json = (await resp.json()) as { secure_url?: string };
    if (!json.secure_url) throw new Error('El servicio de imágenes no devolvió la URL.');
    return json.secure_url;
  }
}
