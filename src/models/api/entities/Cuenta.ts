import type _BaseEntity from '../core/_BaseEntity';

export default interface Cuenta extends _BaseEntity {
  alias: string;
  moneda: string;
  saldo_base: number;
  tipo: 'Ahorro' | 'Corriente';
  usuario_id?: number;
}