import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { CONFIG } from '../config';
import { Estado, Incidencia, NuevaIncidencia } from '../models/incidencia';

@Injectable({ providedIn: 'root' })
export class IncidenciasService {
  private http = inject(HttpClient);
  private readonly url = `${CONFIG.mockApiUrl}/incidencias`;

  /** R3: una página pedida al SERVIDOR. page empieza en 1 en MockAPI. */
  listar(page: number, limit = CONFIG.pageSize): Observable<Incidencia[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('limit', limit)
      .set('sortBy', 'fecha')
      .set('order', 'desc');
    return this.http.get<Incidencia[]>(this.url, { params }).pipe(this.vacioSi404());
  }

  /** Todas las incidencias: SOLO para calcular indicadores del inicio (ver decisión 1.3). */
  todas(): Observable<Incidencia[]> {
    return this.http.get<Incidencia[]>(this.url).pipe(this.vacioSi404());
  }

  obtener(id: string): Observable<Incidencia> {
    return this.http.get<Incidencia>(`${this.url}/${id}`);
  }

  crear(data: NuevaIncidencia): Observable<Incidencia> {
    return this.http.post<Incidencia>(this.url, data);
  }

  /** R9: actualiza estado y observación en el servicio de oficina. */
  cambiarEstado(id: string, estado: Estado, observacion: string | null): Observable<Incidencia> {
    return this.http.put<Incidencia>(`${this.url}/${id}`, { estado, observacion });
  }

  /** MockAPI puede responder 404 "Not found" cuando no hay resultados: lo tratamos como lista vacía. */
  private vacioSi404() {
    return (fuente: Observable<Incidencia[]>): Observable<Incidencia[]> =>
      fuente.pipe(
        catchError((e: unknown) => {
          if (e instanceof HttpErrorResponse && e.status === 404) return of([] as Incidencia[]);
          return throwError(() => e);
        }),
      );
  }
}
