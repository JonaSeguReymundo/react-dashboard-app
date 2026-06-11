import type _BaseEntity from '../core/_BaseEntity';

export default interface Categoria extends _BaseEntity {
  nombre: string;
  tipo: 'Ingreso' | 'Egreso';
  categoria_padre_id?: number;
}