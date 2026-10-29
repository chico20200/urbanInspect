import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonButton,
  IonIcon,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline, locationOutline, calendarOutline } from 'ionicons/icons';
import { ESTADO_LABEL, Incidencia, tipoLabel } from '../../models/incidencia';

/** Tarjeta reutilizada en Incidencias y Seguimiento: muestra los 8 campos de R2. */
@Component({
  selector: 'app-incidencia-card',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonButton,
    IonIcon,
  ],
  template: `
    @let i = incidencia();
    <ion-card>
      @if (i.fotoUrl) {
        <img class="foto" [src]="i.fotoUrl" [alt]="'Foto de ' + i.codigo" loading="lazy" />
      }
      <ion-card-header [routerLink]="['/incidencia', i.id]">
        <div class="fila">
          <ion-card-subtitle>{{ i.codigo }} · {{ tipo(i.tipo) }}</ion-card-subtitle>
          <ion-badge [class]="'estado-' + i.estado">{{ estadoLabel[i.estado] }}</ion-badge>
        </div>
        <ion-card-title>{{ i.descripcion }}</ion-card-title>
      </ion-card-header>
      <ion-card-content [routerLink]="['/incidencia', i.id]">
        <p><ion-icon name="location-outline"></ion-icon> {{ i.direccion }} — {{ i.sector }}</p>
        <p><ion-icon name="calendar-outline"></ion-icon> {{ i.fecha | date: 'dd/MM/yyyy HH:mm' }}</p>
      </ion-card-content>
      <ion-button fill="clear" expand="block" (click)="seguimiento.emit(i)">
        <ion-icon slot="start" [name]="marcada() ? 'bookmark' : 'bookmark-outline'"></ion-icon>
        {{ marcada() ? 'Quitar de seguimiento' : 'Marcar para seguimiento' }}
      </ion-button>
    </ion-card>
  `,
  styles: `
    .foto { width: 100%; max-height: 200px; object-fit: cover; }
    .fila { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    ion-card-title { font-size: 1.1rem; }
    p { display: flex; align-items: center; gap: 6px; margin: 4px 0; }
  `,
})
export class IncidenciaCardComponent {
  incidencia = input.required<Incidencia>();
  marcada = input(false);
  seguimiento = output<Incidencia>();

  readonly estadoLabel = ESTADO_LABEL;
  readonly tipo = tipoLabel;

  constructor() {
    addIcons({ bookmark, bookmarkOutline, locationOutline, calendarOutline });
  }
}
