import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

// Lo que guardamos en el dispositivo: el código visible y el id para pedir el registro a la API
export interface MarcaSeguimiento {
  id: string;
  codigo: string;
}

const KEY = 'seguimiento';

@Injectable({ providedIn: 'root' })
export class SeguimientoService {
  /** Copia en memoria para que todas las pantallas vean el mismo estado al instante. */
  readonly marcas = signal<MarcaSeguimiento[]>([]);
  private cargado = false;

  async cargar(): Promise<MarcaSeguimiento[]> {
    if (!this.cargado) {
      const { value } = await Preferences.get({ key: KEY });
      this.marcas.set(value ? (JSON.parse(value) as MarcaSeguimiento[]) : []);
      this.cargado = true;
    }
    return this.marcas();
  }

  estaMarcada(id: string): boolean {
    return this.marcas().some((m) => m.id === id);
  }

  /** Marca o desmarca. Solo toca el almacenamiento local: NUNCA llama a la API (R1). */
  async alternar(marca: MarcaSeguimiento): Promise<boolean> {
    await this.cargar();
    const existe = this.estaMarcada(marca.id);
    const nuevas = existe
      ? this.marcas().filter((m) => m.id !== marca.id)
      : [...this.marcas(), marca];
    this.marcas.set(nuevas);
    await Preferences.set({ key: KEY, value: JSON.stringify(nuevas) });
    return !existe;
  }
}
