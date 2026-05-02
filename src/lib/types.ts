
export interface Trabajador {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  fechaRegistro: string;
  telefono?: string;
}

export interface Articulo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  unidad: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
}

export type TipoMovimiento = 'entrada' | 'salida';

export interface Movimiento {
  id: string;
  materialId: string;
  materialNombre: string;
  trabajadorId?: string;
  trabajadorNombre?: string;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: string;
  notas?: string;
}
