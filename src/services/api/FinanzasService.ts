import { appSettings } from '@/AppSettings';
import Service from '@/services/core/Service';
import type _BaseEntity from '@/models/api/core/_BaseEntity';

export default class FinanzasService<Entity extends _BaseEntity = any> extends Service<Entity> {
constructor(endpoint: string) {
super({
origin: appSettings.apiService,
initPath: 'api/finanzas', 
endpoint: endpoint, 
});
}

public async findAll(params: any = {}): Promise<any> {
return await super.findAll(params);
}

public async create(params: any): Promise<any> {
return await super.create(params);
}
}

export const cuentasService = new FinanzasService<any>('/cuentas');
export const movimientosService = new FinanzasService<any>('/movimientos');
export const transferenciasService = new FinanzasService<any>('/transferencias');
export const categoriasService = new FinanzasService<any>('/categorias');