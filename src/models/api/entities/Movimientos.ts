import type _BaseEntity from '../core/_BaseEntity';

export default interface Movimiento extends _BaseEntity {
  monto: number;
  moneda_original: string;
  tasa_cambio: number;
  fecha: string;
  descripcion: string;
  cuenta_id: number;
  categoria_id: number;
}