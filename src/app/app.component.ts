import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonApp, IonRouterOutlet } from '@ionic/angular';
import { BorradorService } from './services/borrador.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
})
export class AppComponent {
  private borradores = inject(BorradorService);
  private alerts = inject(AlertController);
  private router = inject(Router);
  private auth = inject(AuthService);

  constructor() {
    // Apenas el inspector inicia sesión, se revisa si quedó un borrador pendiente
    effect(() => {
      if (this.auth.usuario()) void this.revisarBorrador();
    });
  }

  /** R8: al entrar a la app, si quedó un registro a medias, se ofrece continuar o descartar. */
  private async revisarBorrador(): Promise<void> {
    const b = await this.borradores.obtener();
    if (!b || !this.borradores.tieneContenido(b)) return;

    const hora = new Date(b.guardadoEn).toLocaleString('es-EC');
    const alerta = await this.alerts.create({
      header: 'Registro sin terminar',
      message: `Tienes una incidencia a medio registrar (${hora}). ¿Quieres continuarla?`,
      backdropDismiss: false,
      buttons: [
        {
          text: 'Descartar',
          role: 'destructive',
          handler: () => this.borradores.descartar(),
        },
        {
          text: 'Continuar',
          handler: () => this.router.navigate(['/nueva'], { queryParams: { borrador: 1 } }),
        },
      ],
    });
    await alerta.present();
  }
}
