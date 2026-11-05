import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonButtons,
  ActionSheetController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, contrastOutline, sunnyOutline, moonOutline, logOutOutline } from 'ionicons/icons';
import { Incidencia } from '../../models/incidencia';
import { IncidenciasService } from '../../services/incidencias.service';
import { SeguimientoService } from '../../services/seguimiento.service';
import { ModoTema, TemaService } from '../../services/tema.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonButtons,
  ],
})
export class InicioPage {
  private api = inject(IncidenciasService);
  private seguimiento = inject(SeguimientoService);
  private router = inject(Router);
  private tema = inject(TemaService);
  private actionSheets = inject(ActionSheetController);
  private auth = inject(AuthService);

  /** Correo del inspector con sesión iniciada */
  correo = computed(() => this.auth.usuario()?.email ?? '');

  private todas = signal<Incidencia[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // computed: se recalculan solos cuando cambia "todas"
  total = computed(() => this.todas().length);
  pendientes = computed(() => this.todas().filter((i) => i.estado === 'pendiente').length);
  enProceso = computed(() => this.todas().filter((i) => i.estado === 'en_proceso').length);
  resueltas = computed(() => this.todas().filter((i) => i.estado === 'resuelta').length);
  altaAbiertas = computed(
    () => this.todas().filter((i) => i.prioridad === 'alta' && i.estado !== 'resuelta').length,
  );
  enSeguimiento = computed(() => this.seguimiento.marcas().length);

  // Ícono del botón de apariencia según el modo actual
  iconoTema = computed(() => {
    const iconos: Record<ModoTema, string> = {
      sistema: 'contrast-outline',
      claro: 'sunny-outline',
      oscuro: 'moon-outline',
    };
    return iconos[this.tema.modo()];
  });

  constructor() {
    addIcons({ addCircleOutline, contrastOutline, sunnyOutline, moonOutline, logOutOutline });
  }

  /** R10: cada vez que se vuelve al inicio, los indicadores se recalculan con datos frescos. */
  async ionViewWillEnter(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.seguimiento.cargar();
      this.todas.set(await firstValueFrom(this.api.todas()));
    } catch {
      this.error.set('No se pudieron cargar los indicadores.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Menú para elegir claro, oscuro o el modo del sistema. */
  async elegirTema(): Promise<void> {
    const marca = (m: ModoTema) => (this.tema.modo() === m ? ' ✓' : '');
    const hoja = await this.actionSheets.create({
      header: 'Apariencia',
      buttons: [
        { text: 'Claro' + marca('claro'), icon: 'sunny-outline', handler: () => this.tema.cambiar('claro') },
        { text: 'Oscuro' + marca('oscuro'), icon: 'moon-outline', handler: () => this.tema.cambiar('oscuro') },
        { text: 'Igual que el teléfono' + marca('sistema'), icon: 'contrast-outline', handler: () => this.tema.cambiar('sistema') },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await hoja.present();
  }

  /** Cierra la sesión de Firebase y vuelve al login. */
  async cerrarSesion(): Promise<void> {
    await this.auth.salir();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  nueva(): void {
    this.router.navigate(['/nueva']);
  }

  ir(tab: string): void {
    this.router.navigate(['/tabs', tab]);
  }
}