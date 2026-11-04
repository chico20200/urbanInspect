import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type ModoTema = 'sistema' | 'claro' | 'oscuro';

const KEY = 'tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  /** Modo elegido por el inspector. "sistema" sigue la configuración del teléfono. */
  readonly modo = signal<ModoTema>('sistema');

  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');

  /** Se ejecuta una vez al arrancar la app (ver main.ts), antes de pintar la primera pantalla. */
  async iniciar(): Promise<void> {
    const { value } = await Preferences.get({ key: KEY });
    if (value === 'sistema' || value === 'claro' || value === 'oscuro') {
      this.modo.set(value);
    }
    this.aplicar();
    // Si el modo es "sistema" y el teléfono cambia de claro a oscuro, la app lo sigue en vivo
    this.media.addEventListener('change', () => this.aplicar());
  }

  /** Cambia el modo, lo aplica al instante y lo recuerda para la próxima vez. */
  async cambiar(modo: ModoTema): Promise<void> {
    this.modo.set(modo);
    this.aplicar();
    await Preferences.set({ key: KEY, value: modo });
  }

  /** Pone o quita la clase que activa la paleta oscura de Ionic (dark.class.css). */
  private aplicar(): void {
    const oscuro = this.modo() === 'oscuro' || (this.modo() === 'sistema' && this.media.matches);
    document.documentElement.classList.toggle('ion-palette-dark', oscuro);
  }
}