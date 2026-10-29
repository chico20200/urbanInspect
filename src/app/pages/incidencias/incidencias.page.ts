import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
  RefresherCustomEvent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { CONFIG } from '../../config';
import { Incidencia } from '../../models/incidencia';
import { IncidenciasService } from '../../services/incidencias.service';
import { SeguimientoService } from '../../services/seguimiento.service';
import { IncidenciaCardComponent } from '../../components/incidencia-card/incidencia-card.component';

@Component({
  selector: 'app-incidencias',
  templateUrl: './incidencias.page.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonRefresher,
    IonRefresherContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IncidenciaCardComponent,
  ],
})
export class IncidenciasPage implements OnInit {
  private api = inject(IncidenciasService);
  seguimiento = inject(SeguimientoService);
  private router = inject(Router);

  incidencias = signal<Incidencia[]>([]);
  hasMore = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);
  pageError = signal<string | null>(null);

  private page = 1; // próxima página a pedir (MockAPI empieza en 1)
  private loadingMore = false;
  private requestId = 0;
  private yaCargo = false;

  constructor() {
    addIcons({ add });
  }

  ngOnInit(): void {
    this.seguimiento.cargar();
    this.cargarPrimera();
  }

  /** R10: al volver a esta pestaña (p. ej. tras registrar o actualizar) se recarga. */
  ionViewWillEnter(): void {
    if (this.yaCargo) this.cargarPrimera();
  }

  async cargarPrimera(): Promise<void> {
    const mi = ++this.requestId;
    this.incidencias.set([]);
    this.page = 1;
    this.hasMore.set(true);
    this.error.set(null);
    this.pageError.set(null);
    this.loading.set(true);
    try {
      const datos = await firstValueFrom(this.api.listar(1));
      if (mi !== this.requestId) return;
      this.incidencias.set(datos);
      this.page = 2;
      this.hasMore.set(datos.length === CONFIG.pageSize);
      this.yaCargo = true;
    } catch {
      if (mi !== this.requestId) return;
      this.error.set('No se pudo consultar el servicio de oficina. Revisa tu conexión.');
    } finally {
      if (mi === this.requestId) this.loading.set(false);
    }
  }

  async cargarMas(ev: InfiniteScrollCustomEvent): Promise<void> {
    try {
      await this.siguientePagina();
    } finally {
      await ev.target.complete();
    }
  }

  reintentarPagina(): void {
    this.pageError.set(null);
    this.siguientePagina();
  }

  private async siguientePagina(): Promise<void> {
    if (this.loadingMore || !this.hasMore()) return;
    this.loadingMore = true;
    const mi = this.requestId;
    try {
      const datos = await firstValueFrom(this.api.listar(this.page));
      if (mi !== this.requestId) return;
      // Si alguien registró una incidencia mientras bajamos, las páginas se corren: evitamos repetidos
      const vistos = new Set(this.incidencias().map((i) => i.id));
      this.incidencias.update((l) => [...l, ...datos.filter((d) => !vistos.has(d.id))]);
      this.page++;
      this.hasMore.set(datos.length === CONFIG.pageSize);
    } catch {
      if (mi !== this.requestId) return;
      this.pageError.set('Falló la carga de más incidencias.');
    } finally {
      this.loadingMore = false;
    }
  }

  async refrescar(ev: RefresherCustomEvent): Promise<void> {
    await this.cargarPrimera();
    await ev.target.complete();
  }

  async alternarSeguimiento(i: Incidencia): Promise<void> {
    await this.seguimiento.alternar({ id: i.id, codigo: i.codigo });
  }

  nueva(): void {
    this.router.navigate(['/nueva']);
  }
}
