import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Coordenadas } from '../models/incidencia';

export type ResultadoUbicacion =
  | { estado: 'ok'; coords: Coordenadas }
  | { estado: 'sin-permiso' }
  | { estado: 'error'; mensaje: string };

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  /** R7: coordenadas actuales del GPS. Devuelve qué pasó en vez de lanzar excepción. */
  async obtener(): Promise<ResultadoUbicacion> {
    try {
      if (Capacitor.isNativePlatform()) {
        let permiso = await Geolocation.checkPermissions();
        if (permiso.location !== 'granted') {
          permiso = await Geolocation.requestPermissions({ permissions: ['location'] });
        }
        if (permiso.location === 'denied') return { estado: 'sin-permiso' };
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      return {
        estado: 'ok',
        coords: {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        },
      };
    } catch (e: unknown) {
      const code = (e as { code?: string | number })?.code;
      const msg = (e as { message?: string })?.message ?? '';
      // OS-PLUG-GLOC-0003 = permiso denegado (Android/iOS); 1 = PERMISSION_DENIED en navegador
      if (code === 'OS-PLUG-GLOC-0003' || code === 1 || /denied|permission/i.test(msg)) {
        return { estado: 'sin-permiso' };
      }
      return { estado: 'error', mensaje: msg || 'No se pudo obtener la ubicación.' };
    }
  }
}
