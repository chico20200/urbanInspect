import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonNote,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline } from 'ionicons/icons';
import {
  ESTADO_LABEL,
  Estado,
  Incidencia,
  TRANSICIONES,
  puedeCambiar,
  tipoLabel,
} from '../../models/incidencia';
import { IncidenciasService } from '../../services/incidencias.service';
import { SeguimientoService } from '../../services/seguimiento.service';

@Component({
  selector: 'app-detalle',
  templateUrl: './detalle.page.html',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonNote,
  ],
})
export class DetallePage implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(IncidenciasService);
  seguimiento = inject(SeguimientoService);
  private toasts = inject(ToastController);

  incidencia = signal<Incidencia | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);
  errorEstado = signal<string | null>(null);

  nuevoEstado: Estado | null = null;
  observacion = '';

  readonly estadoLabel = ESTADO_LABEL;
  readonly tipo = tipoLabel;

  /** Solo se ofrecen los estados permitidos desde el actual (R9). */
  opciones = computed(() => {
    const i = this.incidencia();
    return i ? TRANSICIONES[i.estado] : [];
  });

  constructor() {
    addIcons({ bookmark, bookmarkOutline });
  }

  ngOnInit(): void {
    this.seguimiento.cargar();
    this.cargar();
  }

  async cargar(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading.set(true);
    this.error.set(null);
    try {
      this.incidencia.set(await firstValueFrom(this.api.obtener(id)));
    } catch (e) {
      this.error.set(
        e instanceof HttpErrorResponse && e.status === 404
          ? 'Esta incidencia no existe en el servicio de oficina.'
          : 'No se pudo cargar la incidencia. Revisa tu conexión.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async cambiarEstado(): Promise<void> {
    const i = this.incidencia();
    if (!i || !this.nuevoEstado) return;
    this.errorEstado.set(null);

    // Regla 1: la transición debe estar permitida (la UI ya lo limita, pero validamos igual)
    if (!puedeCambiar(i.estado, this.nuevoEstado)) {
      this.errorEstado.set(
        `No se puede pasar de "${ESTADO_LABEL[i.estado]}" a "${ESTADO_LABEL[this.nuevoEstado]}".`,
      );
      return;
    }
    // Regla 2: para resolver, la observación es obligatoria
    const obs = this.observacion.trim();
    if (this.nuevoEstado === 'resuelta' && obs.length === 0) {
      this.errorEstado.set('Para marcarla como resuelta debes escribir una observación.');
      return;
    }

    this.guardando.set(true);
    try {
      const actualizada = await firstValueFrom(
        this.api.cambiarEstado(i.id, this.nuevoEstado, obs || i.observacion),
      );
      this.incidencia.set({ ...i, ...actualizada });
      this.nuevoEstado = null;
      this.observacion = '';
      const t = await this.toasts.create({
        message: 'Estado actualizado en el servicio de oficina.',
        duration: 2000,
        color: 'success',
      });
      await t.present();
    } catch {
      this.errorEstado.set('No se pudo guardar el cambio. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      this.guardando.set(false);
    }
  }

  async alternarSeguimiento(): Promise<void> {
    const i = this.incidencia();
    if (i) await this.seguimiento.alternar({ id: i.id, codigo: i.codigo });
  }
}
