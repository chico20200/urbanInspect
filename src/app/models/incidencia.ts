export type Estado = 'pendiente' | 'en_proceso' | 'resuelta';
export type Prioridad = 'baja' | 'media' | 'alta';
export type TipoIncidencia = 'luminaria' | 'bache' | 'senalizacion' | 'alcantarilla' | 'parque';

// Un registro tal como vive en MockAPI (recurso "incidencias")
export interface Incidencia {
  id: string; // lo genera MockAPI
  codigo: string; // código visible, ej. INC-LX3K9A
  tipo: TipoIncidencia;
  descripcion: string;
  direccion: string;
  sector: string;
  fecha: string; // ISO 8601
  estado: Estado;
  prioridad: Prioridad;
  fotoUrl: string | null; // URL pública (Cloudinary), nunca una ruta temporal del teléfono
  lat: number | null;
  lng: number | null;
  observacion: string | null; // obligatoria al pasar a "resuelta" (R9)
  climaTemperatura: number | null; // °C al momento del registro (R4)
  climaPrecipitacion: number | null; // mm en la última hora
  climaDescripcion: string | null;
}

// Lo que enviamos al crear: todo menos el id (lo asigna MockAPI)
export type NuevaIncidencia = Omit<Incidencia, 'id'>;

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface Clima {
  temperatura: number; // °C
  precipitacionUltimaHora: number; // mm
  descripcion: string;
  horaReferencia: string; // hora local a la que corresponde la precipitación
  advertenciaLluvia: boolean; // true si supera el umbral (5 mm)
}

export const TIPOS: { value: TipoIncidencia; label: string }[] = [
  { value: 'luminaria', label: 'Luminaria dañada' },
  { value: 'bache', label: 'Bache' },
  { value: 'senalizacion', label: 'Señalización deteriorada' },
  { value: 'alcantarilla', label: 'Alcantarilla obstruida' },
  { value: 'parque', label: 'Daño en parque' },
];

export const ESTADO_LABEL: Record<Estado, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  resuelta: 'Resuelta',
};

// R9: a qué estados se puede pasar desde cada estado
export const TRANSICIONES: Record<Estado, Estado[]> = {
  pendiente: ['en_proceso', 'resuelta'],
  en_proceso: ['resuelta'],
  resuelta: [], // una resuelta no regresa a ningún estado
};

export function puedeCambiar(desde: Estado, hacia: Estado): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

export function tipoLabel(tipo: string): string {
  return TIPOS.find((t) => t.value === tipo)?.label ?? tipo;
}

export function coordenadasValidas(lat: unknown, lng: unknown): boolean {
  if (lat === null || lat === '' || lng === null || lng === '') return false;
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln) && la >= -90 && la <= 90 && ln >= -180 && ln <= 180;
}

// Código legible y único: INC- + tiempo en base 36 + 2 caracteres aleatorios
export function generarCodigo(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `INC-${t}${r}`;
}
