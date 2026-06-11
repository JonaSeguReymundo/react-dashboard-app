import type { RoleName } from '@/enum/role'
import { RoutesEnum } from '@/enum/routes..app'

type RouteConfig = {
  auth: boolean
  roles: RoleName[]
  permission: string[]
  title: string
  search: boolean
}

export const routesConfig: Record<RoutesEnum, RouteConfig> = {
  [RoutesEnum.ROOT]: {
    auth: true,
    roles: [],
    permission: ['*'],
    title: 'Inicio',
    search: false,
  },
  [RoutesEnum.LOGIN]: {
    auth: false,
    roles: [],
    permission: ['*'],
    title: 'Login',
    search: false,
  },
  [RoutesEnum.DASHBOARD]: {
    auth: true,
    roles: ['*'],
    permission: ['*'],
    title: 'Dashboard',
    search: true,
  },
  [RoutesEnum.ROLES]: {
    auth: true,
    roles: ['*'],
    permission: ['*'],
    title: 'Roles',
    search: true,
  },
  [RoutesEnum.PERMISSIONS]: {
    auth: true,
    roles: ['*'],
    permission: ['*'],
    title: 'Permisos',
    search: true,
  },
  [RoutesEnum.MOVIMIENTOS]: { 
    auth: true,            
    roles: ['*'],           
    permission: ['*'],    
    title: 'Movimientos',  
    search: true,           
  },
} as const
