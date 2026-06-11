import { appSettings } from '@/AppSettings';
import Service from '@/services/core/Service';
import type _BaseEntity from '@/models/api/core/_BaseEntity';

/**
* Servicio especializado para el módulo de Finanzas.
* Se encarga de prefijar la ruta correctamente para que el axiosInstance
* resuelva la URL hacia /api/finanzas/...
*/
export default class FinanzasService<Entity extends _BaseEntity = any> extends Service<Entity> {
constructor(endpoint: string) {
super({
origin: appSettings.apiService,
initPath: 'api/finanzas', // Prefijo requerido para el controlador de Finanzas en el backend
endpoint: endpoint, // El endpoint específico (ej: '/cuentas', '/movimientos')
});
}

/**
* findAll: Obtiene registros con paginación.
* Utiliza la implementación de la clase base Service.
*/
public async findAll(params: any = {}): Promise<any> {
return await super.findAll(params);
}

/**
* create: Registra una nueva entidad financiera.
*/
public async create(params: any): Promise<any> {
return await super.create(params);
}
}

// Instancias globales listas para ser inyectadas en tus vistas
export const cuentasService = new FinanzasService<any>('/cuentas');
export const movimientosService = new FinanzasService<any>('/movimientos');
export const transferenciasService = new FinanzasService<any>('/transferencias');
export const categoriasService = new FinanzasService<any>('/categorias');