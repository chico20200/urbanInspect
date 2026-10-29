import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, firstValueFrom } from 'rxjs';
import {
  AlertController,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonCard,
  IonCardContent,
  IonText,
  IonSpinner,
  IonNote,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, locateOutline, trashOutline, rainyOutline, checkmarkCircleOutline } from 'ionicons/icons';
import {
  Clima,
  Coordenadas,
  NuevaIncidencia,
  Prioridad,
  TIPOS,
  TipoIncidencia,
  coordenadasValidas,
  generarCodigo,
} from '../../models/incidencia';
import { IncidenciasService } from '../../services/incidencias.service';
import { ClimaService } from '../../services/clima.service';
import { FotoService } from '../../services/foto.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { BorradorService } from '../../services/borrador.service';

@Component({
  selector: 'app-nueva',
  templateUrl: './nueva.page.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonCard,
    IonCardContent,
    IonText,
    IonSpinner,
    IonNote,
  ],
})
export class NuevaPage implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private alerts = inject(AlertController);
  private toasts = inject(ToastController);
  private api = inject(IncidenciasService);
  private climaSrv = inject(ClimaService);
  private fotoSrv = inject(FotoService);
  private ubicacion = inject(UbicacionService);
  private borradores = inject(BorradorService);

  readonly tipos = TIPOS;

  form = this.fb.group({
    tipo: ['', Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    direccion: ['', Validators.required],
    sector: ['', Validators.required],
    prioridad: ['media', Validators.required],
    lat: [null as number | string | null],
    lng: [null as number | string | null],
  });

  // Foto (R6)
  fotoPath = signal<string | null>(null);
  fotoAviso = signal<string | null>(null);
  permisoCamaraDenegado = signal(false);

  // Ubicación (R7)
  buscandoGps = signal(false);
  ubicacionAviso = signal<string | null>(null);

  // Clima (R4)
  clima = signal<Clima | null>(null);
  climaCargando = signal(false);
  climaError = signal<string | null>(null);
  private climaPara: string | null = null; // coordenadas a las que corresponde el clima mostrado
  private climaRequest = 0;

  guardando = signal(false);
  errores = signal<string[]>([]);

  constructor() {
    addIcons({ cameraOutline, locateOutline, trashOutline, rainyOutline, checkmarkCircleOutline });
  }

  async ngOnInit(): Promise<void> {
    await this.prepararBorrador();
    this.activarAutoguardado();
    this.invalidarClimaSiCambianCoordenadas();
  }

  // ---------- R8: borrador ----------

  private async prepararBorrador(): Promise<void> {
    const b = await this.borradores.obtener();
    if (!b || !this.borradores.tieneContenido(b)) return;

    // Si venimos desde la alerta del inicio de la app, ya se eligió "Continuar"
    if (this.route.snapshot.queryParamMap.get('borrador') === '1') {
      this.restaurar(b);
      return;
    }
    // Si el inspector abandonó el formulario y vuelve a entrar, también se le pregunta
    const alerta = await this.alerts.create({
      header: 'Registro sin terminar',
      message: '¿Quieres continuar con la incidencia que dejaste a medias?',
      backdropDismiss: false,
      buttons: [
        { text: 'Descartar', role: 'destructive', handler: () => this.borradores.descartar() },
        { text: 'Continuar', handler: () => this.restaurar(b) },
      ],
    });
    await alerta.present();
    await alerta.onDidDismiss();
  }

  private restaurar(b: Awaited<ReturnType<BorradorService['obtener']>>): void {
    if (!b) return;
    this.form.patchValue({
      tipo: b.tipo,
      descripcion: b.descripcion,
      direccion: b.direccion,
      sector: b.sector,
      prioridad: b.prioridad || 'media',
      lat: b.lat,
      lng: b.lng,
    });
    this.fotoAviso.set('La foto no se recupera del borrador: vuelve a tomarla si hace falta.');
  }

  private activarAutoguardado(): void {
    // Cada cambio (con 400 ms de pausa) se guarda en el dispositivo
    this.form.valueChanges
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const v = this.form.getRawValue();
        this.borradores.guardar({
          tipo: v.tipo ?? '',
          descripcion: v.descripcion ?? '',
          direccion: v.direccion ?? '',
          sector: v.sector ?? '',
          prioridad: v.prioridad ?? 'media',
          lat: v.lat ?? null,
          lng: v.lng ?? null,
        });
      });
  }

  async descartarFormulario(): Promise<void> {
    await this.borradores.descartar();
    this.router.navigate(['/tabs/inicio'], { replaceUrl: true });
  }

  // ---------- R6: foto ----------

  async tomarFoto(): Promise<void> {
    const r = await this.fotoSrv.tomar();
    switch (r.estado) {
      case 'ok':
        this.fotoPath.set(r.webPath);
        this.fotoAviso.set(null);
        this.permisoCamaraDenegado.set(false);
        break;
      case 'cancelada':
        // No tocamos el formulario: los demás datos siguen intactos
        await this.toast('Captura cancelada. Tus datos siguen en el formulario.');
        break;
      case 'sin-permiso':
        this.permisoCamaraDenegado.set(true);
        this.fotoAviso.set(
          this.esAlta()
            ? 'Sin permiso de cámara no puedes registrar una incidencia de prioridad ALTA (exige foto). Habilita la cámara en Ajustes del teléfono o cambia la prioridad.'
            : 'Permiso de cámara denegado. La foto es opcional para esta prioridad.',
        );
        break;
      case 'error':
        this.fotoAviso.set(r.mensaje);
    }
  }

  quitarFoto(): void {
    this.fotoPath.set(null);
  }

  esAlta(): boolean {
    return this.form.controls.prioridad.value === 'alta';
  }

  esBache(): boolean {
    return this.form.controls.tipo.value === 'bache';
  }

  // ---------- R7: ubicación ----------

  async usarGps(): Promise<void> {
    this.buscandoGps.set(true);
    this.ubicacionAviso.set(null);
    const r = await this.ubicacion.obtener();
    this.buscandoGps.set(false);
    if (r.estado === 'ok') {
      this.form.patchValue({ lat: r.coords.lat, lng: r.coords.lng });
      await this.consultarClima();
    } else if (r.estado === 'sin-permiso') {
      this.ubicacionAviso.set('Permiso de ubicación denegado. Ingresa las coordenadas manualmente.');
    } else {
      this.ubicacionAviso.set(`${r.mensaje} Puedes ingresar las coordenadas manualmente.`);
    }
  }

  /** Coordenadas del formulario si son válidas; null si faltan o son inválidas. */
  coordenadas(): Coordenadas | null {
    const { lat, lng } = this.form.getRawValue();
    return coordenadasValidas(lat, lng) ? { lat: Number(lat), lng: Number(lng) } : null;
  }

  // ---------- R4: clima ----------

  async consultarClima(): Promise<void> {
    const c = this.coordenadas();
    if (!c) {
      this.climaError.set('Ingresa coordenadas válidas para consultar el clima.');
      return;
    }
    const mi = ++this.climaRequest;
    this.climaCargando.set(true);
    this.climaError.set(null);
    this.clima.set(null);
    try {
      const r = await firstValueFrom(this.climaSrv.consultar(c));
      if (mi !== this.climaRequest) return; // llegó una respuesta vieja: se ignora
      this.clima.set(r);
      this.climaPara = `${c.lat},${c.lng}`;
    } catch (e) {
      if (mi !== this.climaRequest) return;
      const msg = (e as { message?: string })?.message;
      this.climaError.set(
        `No se pudo obtener el clima${msg ? ': ' + msg : ''}. Puedes guardar la incidencia igualmente.`,
      );
    } finally {
      if (mi === this.climaRequest) this.climaCargando.set(false);
    }
  }

  /** Evita resultados inconsistentes: si cambian las coordenadas, el clima mostrado ya no vale. */
  private invalidarClimaSiCambianCoordenadas(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const c = this.coordenadas();
      const clave = c ? `${c.lat},${c.lng}` : null;
      if (this.climaPara && clave !== this.climaPara) {
        this.climaRequest++; // cualquier consulta en curso queda obsoleta
        this.clima.set(null);
        this.climaPara = null;
        this.climaCargando.set(false);
        this.climaError.set(null);
      }
    });
  }

  // ---------- R5: validar y guardar ----------

  validar(): string[] {
    const e: string[] = [];
    const v = this.form.getRawValue();
    if (this.form.controls.tipo.invalid) e.push('Selecciona el tipo de incidencia.');
    if (this.form.controls.descripcion.invalid) e.push('La descripción es obligatoria (mínimo 10 caracteres).');
    if (this.form.controls.direccion.invalid) e.push('La dirección es obligatoria.');
    if (this.form.controls.sector.invalid) e.push('El sector es obligatorio.');
    if (this.form.controls.prioridad.invalid) e.push('Selecciona la prioridad.');

    if (this.esAlta() && !this.fotoPath()) {
      e.push(
        this.permisoCamaraDenegado()
          ? 'La prioridad alta exige fotografía, pero el permiso de cámara está denegado.'
          : 'La prioridad alta exige fotografía.',
      );
    }
    const algunaCoord = (v.lat ?? '') !== '' || (v.lng ?? '') !== '';
    if (this.esBache() && !this.coordenadas()) {
      e.push('Para un bache la ubicación es obligatoria: usa el GPS o ingresa coordenadas válidas.');
    } else if (algunaCoord && !this.coordenadas()) {
      e.push('Las coordenadas no son válidas (latitud −90 a 90, longitud −180 a 180).');
    }
    return e;
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    const errores = this.validar();
    this.errores.set(errores);
    if (errores.length) return;

    // R4: antes de guardar se consulta el clima (si hay coordenadas y aún no está consultado)
    const c = this.coordenadas();
    if (c && !this.clima()) await this.consultarClima();
    if (!(await this.confirmarClima(c))) return;

    this.guardando.set(true);
    try {
      let fotoUrl: string | null = null;
      if (this.fotoPath()) fotoUrl = await this.fotoSrv.subir(this.fotoPath()!);

      const v = this.form.getRawValue();
      const clima = this.clima();
      const nueva: NuevaIncidencia = {
        codigo: generarCodigo(),
        tipo: v.tipo as TipoIncidencia,
        descripcion: v.descripcion!.trim(),
        direccion: v.direccion!.trim(),
        sector: v.sector!.trim(),
        prioridad: v.prioridad as Prioridad,
        estado: 'pendiente', // toda incidencia nace pendiente
        fecha: new Date().toISOString(),
        fotoUrl,
        lat: c?.lat ?? null,
        lng: c?.lng ?? null,
        observacion: null,
        climaTemperatura: clima?.temperatura ?? null,
        climaPrecipitacion: clima?.precipitacionUltimaHora ?? null,
        climaDescripcion: clima?.descripcion ?? null,
      };
      const creada = await firstValueFrom(this.api.crear(nueva));
      await this.borradores.descartar(); // ya está en la oficina: el borrador sobra
      await this.toast(`Incidencia ${creada.codigo} registrada.`, 'success');
      this.router.navigate(['/incidencia', creada.id], { replaceUrl: true });
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? '';
      this.errores.set([`No se pudo guardar. ${msg} Tus datos siguen en el formulario.`]);
    } finally {
      this.guardando.set(false);
    }
  }

  /** Advierte (sin bloquear) por lluvia > 5 mm, por fallo del servicio o por falta de coordenadas. */
  private async confirmarClima(c: Coordenadas | null): Promise<boolean> {
    let header = '';
    let message = '';
    const clima = this.clima();
    if (!c) {
      header = 'Sin coordenadas';
      message = 'Sin ubicación no se puede consultar el clima. ¿Guardar sin datos meteorológicos?';
    } else if (!clima) {
      header = 'Clima no disponible';
      message = `${this.climaError() ?? 'El servicio meteorológico no respondió.'} ¿Guardar de todos modos?`;
    } else if (clima.advertenciaLluvia) {
      header = 'Lluvia intensa';
      message = `Llovieron ${clima.precipitacionUltimaHora} mm en la última hora: las condiciones podrían dificultar el mantenimiento. ¿Guardar de todos modos?`;
    } else {
      return true;
    }
    const alerta = await this.alerts.create({
      header,
      message,
      buttons: [
        { text: 'Revisar', role: 'cancel' },
        { text: 'Guardar', role: 'confirm' },
      ],
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    return role === 'confirm';
  }

  private async toast(message: string, color = 'dark'): Promise<void> {
    const t = await this.toasts.create({ message, duration: 2500, color });
    await t.present();
  }
}
