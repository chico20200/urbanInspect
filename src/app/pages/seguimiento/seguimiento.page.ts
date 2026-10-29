import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSpinner,
  IonText,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
} from '@ionic/angular';
import { Incidencia } from '../../models/incidencia';
import { IncidenciasService } from '../../services/incidencias.service';
import { MarcaSeguimiento, SeguimientoService } from '../../services/seguimiento.service';
import { IncidenciaCardComponent } from '../../components/incidencia-card/incidencia-card.component';

interface FilaSeguimiento {
  marca: MarcaSeguimiento;
  incidencia: Incidencia | null; // null si ya no se pudo obtener de la API
  problema: string | null;
}

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.page.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    IonText,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IncidenciaCardComponent,
  ],
})
export class SeguimientoPage {
  private api = inject(IncidenciasService);
  seguimiento = inject(SeguimientoService);

  filas = signal<FilaSeguimiento[]>([]);
  loading = signal(false);

  /** Cada vez que se entra a la pestaña: lee los códigos guardados y pide sus datos actuales. */
  async ionViewWillEnter(): Promise<void> {
    this.loading.set(true);
    const marcas = await this.seguimiento.cargar();
    const filas = await Promise.all(marcas.map((m) => this.cargarFila(m)));
    this.filas.set(filas);
    this.loading.set(false);
  }

  private async cargarFila(marca: MarcaSeguimiento): Promise<FilaSeguimiento> {
    try {
      const incidencia = await firstValueFrom(this.api.obtener(marca.id));
      return { marca, incidencia, problema: null };
    } catch (e) {
      const problema =
        e instanceof HttpErrorResponse && e.status === 404
          ? 'Ya no existe en el servicio de oficina.'
          : 'Sin conexión: no se pudieron cargar sus datos.';
      return { marca, incidencia: null, problema };
    }
  }

  /** R1: desmarcar quita la fila al instante. Solo cambia el almacenamiento local. */
  async desmarcar(marca: MarcaSeguimiento): Promise<void> {
    await this.seguimiento.alternar(marca);
    this.filas.update((f) => f.filter((x) => x.marca.id !== marca.id));
  }
}
