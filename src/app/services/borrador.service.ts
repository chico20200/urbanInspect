import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

// Campos del formulario que se pueden recuperar. La foto NO (ruta temporal de la cámara).
export interface Borrador {
  tipo: string;
  descripcion: string;
  direccion: string;
  sector: string;
  prioridad: string;
  lat: number | string | null;
  lng: number | string | null;
  guardadoEn: string; // ISO, para mostrar "borrador de las 10:32"
}

const KEY = 'borrador_incidencia';

@Injectable({ providedIn: 'root' })
export class BorradorService {
  async guardar(datos: Omit<Borrador, 'guardadoEn'>): Promise<void> {
    const borrador: Borrador = { ...datos, guardadoEn: new Date().toISOString() };
    await Preferences.set({ key: KEY, value: JSON.stringify(borrador) });
  }

  async obtener(): Promise<Borrador | null> {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return null;
    try {
      return JSON.parse(value) as Borrador;
    } catch {
      return null; // si el texto guardado está corrupto, se ignora
    }
  }

  async descartar(): Promise<void> {
    await Preferences.remove({ key: KEY });
  }

  /** Un borrador vacío (solo con valores por defecto) no vale la pena ofrecerlo. */
  tieneContenido(b: Borrador): boolean {
    return [b.tipo, b.descripcion, b.direccion, b.sector, b.lat, b.lng].some(
      (v) => v !== null && v !== undefined && String(v).trim() !== '',
    );
  }
}
