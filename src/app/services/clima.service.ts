import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, TimeoutError, catchError, map, throwError, timeout } from 'rxjs';
import { CONFIG } from '../config';
import { Clima, Coordenadas } from '../models/incidencia';

// Forma (resumida) de la respuesta de Open-Meteo
interface OpenMeteoResponse {
  current?: { time: string; temperature_2m: number | null; weather_code: number | null };
  hourly?: { time: string[]; precipitation: (number | null)[] };
}

@Injectable({ providedIn: 'root' })
export class ClimaService {
  private http = inject(HttpClient);

  /** R4: consulta el clima REAL en las coordenadas de la incidencia. */
  consultar(c: Coordenadas): Observable<Clima> {
    const params = new HttpParams()
      .set('latitude', c.lat)
      .set('longitude', c.lng)
      .set('current', 'temperature_2m,weather_code')
      .set('hourly', 'precipitation') // suma de la HORA ANTERIOR a cada marca horaria
      .set('past_hours', 2)
      .set('forecast_hours', 1)
      .set('timezone', 'auto');

    return this.http.get<OpenMeteoResponse>(CONFIG.openMeteoUrl, { params }).pipe(
      timeout(10000), // si no responde en 10 s, se trata como fallo
      map((r) => this.interpretar(r)),
      catchError((e: unknown) => throwError(() => new Error(this.mensajeError(e)))),
    );
  }

  /** Convierte cualquier fallo en un mensaje que el inspector entienda. */
  private mensajeError(e: unknown): string {
    if (e instanceof TimeoutError) return 'el servicio meteorológico no respondió a tiempo';
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0) return 'sin conexión con el servicio meteorológico';
      // Open-Meteo explica el motivo de un 400 en el campo "reason" del cuerpo
      const razon = (e.error as { reason?: string } | null)?.reason;
      return `el servicio meteorológico respondió con error ${e.status}${razon ? ` (${razon})` : ''}`;
    }
    return (e as { message?: string })?.message ?? 'error desconocido';
  }

  private interpretar(r: OpenMeteoResponse): Clima {
    const actual = r.current;
    const horas = r.hourly;
    if (!actual || actual.temperature_2m == null || !horas?.time?.length) {
      throw new Error('no hay datos meteorológicos para esta ubicación');
    }
    // Última marca horaria que NO es futura: su valor = lluvia de la última hora completa.
    // Las horas vienen en la misma zona horaria que current.time (timezone=auto),
    // y el formato ISO permite compararlas como texto.
    let i = -1;
    for (let k = 0; k < horas.time.length; k++) {
      if (horas.time[k] <= actual.time) i = k;
    }
    const lluvia = i >= 0 ? horas.precipitation[i] : null;
    if (lluvia == null) {
      throw new Error('el servicio no informó la precipitación de la última hora');
    }
    return {
      temperatura: actual.temperature_2m,
      precipitacionUltimaHora: lluvia,
      descripcion: describirWmo(actual.weather_code),
      horaReferencia: horas.time[i],
      advertenciaLluvia: lluvia > CONFIG.umbralLluviaMm,
    };
  }
}

/** Códigos WMO que usa Open-Meteo → texto para el inspector. */
export function describirWmo(code: number | null): string {
  if (code == null) return 'Sin descripción';
  if (code === 0) return 'Despejado';
  if (code <= 3) return 'Parcialmente nublado / nublado';
  if (code === 45 || code === 48) return 'Niebla';
  if (code >= 51 && code <= 57) return 'Llovizna';
  if (code >= 61 && code <= 67) return 'Lluvia';
  if (code >= 71 && code <= 77) return 'Nieve';
  if (code >= 80 && code <= 82) return 'Chubascos';
  if (code === 85 || code === 86) return 'Chubascos de nieve';
  if (code >= 95) return 'Tormenta';
  return `Código WMO ${code}`;
}
