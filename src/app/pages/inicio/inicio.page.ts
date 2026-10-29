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
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline } from 'ionicons/icons';
import { Incidencia } from '../../models/incidencia';
import { IncidenciasService } from '../../services/incidencias.service';
import { SeguimientoService } from '../../services/seguimiento.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
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
  ],
})
export class InicioPage {
  private api = inject(IncidenciasService);
  private seguimiento = inject(SeguimientoService);
  private router = inject(Router);

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

  constructor() {
    addIcons({ addCircleOutline });
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

  nueva(): void {
    this.router.navigate(['/nueva']);
  }

  ir(tab: string): void {
    this.router.navigate(['/tabs', tab]);
  }
}
