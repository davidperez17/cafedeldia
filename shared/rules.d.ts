export type Row = Record<string, string>;

export type TabName =
  | 'productos' | 'categorias' | 'leches' | 'metodos' | 'pasos' | 'info' | 'horario' | 'excepciones';

export type Tabs = Record<TabName, Row[]>;

export interface Issue {
  tab: string;
  /** Fila de la Sheet; el encabezado es la fila 1. */
  row: number;
  column?: string;
  /** Mensaje en español para el dueño. */
  message: string;
}

export type Badge = 'especialidad' | 'nuevo' | 'agotado';

export interface Product {
  slug: string;
  nombre: string;
  categoria: string;
  nota: string;
  descripcion: string;
  precio: number;
  precioS?: number;
  precioL?: number;
  leche: boolean;
  badge?: Badge;
  destacado: boolean;
  recomendado: boolean;
  origen?: string;
  tueste?: string;
  notas?: string;
  acompanar: string[];
  imagen?: string;
  orden: number;
}

export interface Category { slug: string; nombre: string; imagen?: string; orden: number }

export interface Milk { slug: string; nombre: string; extra: number; imagen?: string }

export interface Step { n: number; titulo: string; descripcion: string; tiempo?: string; imagen?: string }

export interface Method {
  slug: string;
  nombre: string;
  tiempo: string;
  cuerpo: number;
  acidez: number;
  tipo: string;
  descripcion: string;
  ratio: string;
  molienda: string;
  temperatura: string;
  grano?: string;
  imagen?: string;
  orden: number;
  pasos: Step[];
}

export interface Info {
  nombre: string;
  eslogan: string;
  subtitulo: string;
  direccion?: string;
  mapsUrl?: string;
  whatsapp?: string;
  instagram?: string;
  telefono?: string;
  imagenPortada?: string;
}

export interface DayHours {
  /** 0 = domingo … 6 = sábado */
  dia: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  abre?: string;
  cierra?: string;
}

export interface Exception { fecha: string; abre?: string; cierra?: string; nota?: string }

export interface MenuData {
  productos: Product[];
  categorias: Category[];
  leches: Milk[];
  metodos: Method[];
  info: Info;
  horario: DayHours[];
  excepciones: Exception[];
}

export interface ValidationResult {
  data: MenuData;
  errors: Issue[];
  warnings: Issue[];
  fatal: Issue[];
}

export declare const REQUIRED_COLUMNS: Record<TabName, string[]>;
export declare function parseBool(s: string): boolean;
export declare function parseNumber(s: string): number | null;
export declare function parseTime(s: string): string | null;
export declare function parseDay(s: string): number | null;
export declare function validateWorkbook(tabs: Tabs): ValidationResult;
