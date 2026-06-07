# Documentación técnica completa — react-dashboard-app

Este documento unifica la documentación técnica del proyecto en un único archivo: visión general, configuración, modelos, servicios, hooks, providers, ejemplos y guías para crear servicios custom.

---

**Resumen rápido**
- Stack: React + TypeScript, Vite, Ant Design, TailwindCSS, Recoil, @tanstack/react-query, Axios.
- Empaquetador: Vite (`vite.config.ts`) con proxy `/api` hacia `VITE_API_URL`.
- Linter/formato: ESLint + Prettier; hooks: Husky + lint-staged + Commitlint.

**Comandos principales**
```bash
pnpm install
pnpm dev        # desarrollo (Vite)
pnpm build
pnpm preview
pnpm lint
pnpm lint:fix
```

---

**Variables de entorno**
- `.env`:

```env
VITE_API_URL=http://localhost:4000
VITE_SECRET_KEY=MY_SECRET_KEY
```

`vite.config.ts` usa `VITE_API_URL` para configurar proxy y `axiosInstance` se inicializa con `appSettings.apiService`.

---

**Estructura de alto nivel**
- `src/main.tsx` — bootstrap y render (ver archivo: [src/main.tsx](src/main.tsx#L1-L20)).
- `src/App.tsx` — providers principales: `RecoilRoot`, `QueryClientProvider`, `Routes` (ver [src/App.tsx](src/App.tsx#L1-L50)).
- `src/config/` — rutas, entornos, items de menú.
- `src/pages/` — vistas / pages.
- `src/components/` — componentes reutilizables.
- `src/services/` — servicios API (core + custom).
- `src/hooks/` — hooks reutilizables y helpers.
- `src/models/` — tipos / DTOs para la API.
- `src/utils/` y `src/lib/` — utilidades y cliente de queries.

---

## Client HTTP central: `axiosInstance`
- Archivo: [src/services/utils/axiosInstance.ts](src/services/utils/axiosInstance.ts)
- Comportamiento clave:
  - Crea una instancia `axios` con `baseURL = ${origin}/${initPath}` y timeout de 15s.
  - Request interceptor: añade `Authorization: Bearer <token>` si `appSettings.token` está presente; quita `Content-Type` para `FormData`.
  - Response interceptor: maneja errores 401 y 403.
    - 401: si `config.onUnauthorized` está presente la llama; si no, muestra `toast`, borra token y redirige a `/login`.
    - 403: si `config.onForbidden` está presente la llama; si no, muestra `toast` con aviso de permisos.

Firma de helper:
```ts
export interface AxiosInstanceParams { origin: string; initPath: string }
export const axiosInstance = ({ origin, initPath }: AxiosInstanceParams): AxiosInstance
```

---

## Query client
- Archivo: [src/lib/queryClient.ts](src/lib/queryClient.ts)
- `queryClient` configurado con opciones por defecto: `refetchOnWindowFocus: false`, `retry: false`, `staleTime: 5min`, `gcTime: 30min`.
- `queryKeys` exportado con claves usadas (ej. `session`, `users`).

---

## Modelos y DTOs principales
- Base genérico: `src/models/api/core/_BaseEntity.ts` — campos comunes:

```ts
interface BaseEntity {
  readonly id?: number
  name?: string
  readonly createdAt?: string
  readonly updatedAt?: string
  readonly deletedAt?: string | null
}
```

- `PaginationResponse<T>`: estructura estándar de paginación (data + pagination: total, page, pageSize, nextCursor, pageCount).
- `BaseResponse<T>`: alias `T` (se deja abierto para adaptación futura).

Entidades concretas:
- `User` ([src/models/api/entities/User.ts](src/models/api/entities/User.ts)):
  - `username`, `surname`, `email`, `password`, `role?: Role`
- `Role` ([src/models/api/entities/Role.ts](src/models/api/entities/Role.ts)):
  - `name: RoleName`, `permissions?: Permissions[]`
- `Permissions` ([src/models/api/entities/Permissions.ts](src/models/api/entities/Permissions.ts)):
  - `id?: string`, `path: 'GET' | 'POST' | 'PUT' | 'DELETE'`

---

## Servicios HTTP — abstracción y uso

### `AbstractService<Entity>` (contrato)
- Archivo: [src/models/api/core/AbstractService.ts](src/models/api/core/AbstractService.ts)
- Definición (resumen):

```ts
export type ServiceConfig = AxiosRequestConfig & { onUnauthorized?: () => void; onForbidden?: () => void }

interface ApiServiceParams { endpoint?: string; initPath?: string; origin?: string }

abstract class AbstractService<Entity> {
  abstract findAll(params?: FindAllParams): Promise<PaginationResponse<Entity>>
  abstract findById(params: FindByIdParams): Promise<BaseResponse<Entity>>
  abstract findBy(params: FindBy): Promise<BaseResponse<Entity>>
  abstract create(params: CreateParams<Entity>): Promise<BaseResponse<Entity>>
  abstract update(params: UpdateParams<Entity>): Promise<BaseResponse<Entity>>
  abstract delete(params: DeleteParams): Promise<void>
}
```

### `Service<Entity>` (implementación genérica)
- Archivo: [src/services/core/Service.ts](src/services/core/Service.ts)
- Constructor: `new Service({ origin, initPath = 'api', endpoint = '' })` crea `this.axios` con `axiosInstance`.
- Métodos implementados: `findAll`, `findById`, `findBy`, `create`, `update`, `delete`.
- `getUrl(endpoint?, idOrPath?)` normaliza rutas y concatena `endpoint` con `id` si procede.

Ejemplo de uso básico:

```ts
const s = new Service<{ id?: number; name?: string }>({ origin: 'http://localhost:4000', endpoint: '/items' })
await s.findAll({ endpoint: '/items' })
```

### `UserService` (servicio real)
- Archivo: [src/services/api/custom/UserService.ts](src/services/api/custom/UserService.ts)
- Extiende `Service<User>` y configura `endpoint: '/users'`.
- Métodos públicos adicionales:
  - `login({ username, password, onUnauthorized? }): Promise<SessionResponse>` — POST `/auth/login`.
  - `signUp({ payload: User }): Promise<SessionResponse>` — POST `/auth/signup`.
  - `profile(): Promise<User>` — GET `/auth/profile`.

Uso:
```ts
import UserService from '@/services/api/custom/UserService'
const userService = new UserService()
await userService.login({ username: 'u', password: 'p' })
const profile = await userService.profile()
```

### `onUnauthorized` y `onForbidden`
- `AbstractService` permite pasar en `config` los callbacks `onUnauthorized?: () => void` y `onForbidden?: () => void`.
- `Service` los reenvía a `this.axios` y `axiosInstance` los consume en el interceptor de respuesta.
- `axiosInstance` maneja:
  - `401`: ejecuta `config.onUnauthorized` si existe; si no, muestra toast, borra token y redirige a `/login`.
  - `403`: ejecuta `config.onForbidden` si existe; si no, muestra toast de permisos.

Ejemplo directo con `Service`:

```ts
await itemService.findAll({
  endpoint: '/items',
  config: {
    params: { active: true },
    onUnauthorized: () => console.log('usuario no autorizado'),
    onForbidden: () => console.log('acceso prohibido'),
  },
})
```

Ejemplo de `UserService.login` con `onUnauthorized`:

```ts
const userService = new UserService()
await userService.login({
  username: 'u',
  password: 'p',
  onUnauthorized: () => {
    console.log('login requerido')
  },
})
```

Ejemplo de clase custom con Axios config:

```ts
import Service from '@/services/core/Service'
import type Product from '@/models/api/entities/Product'

export default class ProductService extends Service<Product> {
  constructor() {
    super({ endpoint: '/products' })
  }

  public async publish(id: string) {
    const res = await this.axios.post<Product>(
      `/products/${id}/publish`,
      {},
      {
        onUnauthorized: () => console.log('Token inválido o expirado'),
        onForbidden: () => console.log('No tienes permiso para publicar'),
      }
    )
    return res.data
  }
}
```

### `services/api/index.ts` (exportadores)
- En el repo hay un archivo que agrupa/instancia servicios y exporta instancias para uso en providers/hooks (ver `[src/services/api/index.ts]`).

---

## Hooks — lista, firmas y ejemplos

Todos los hooks relevantes están en `src/hooks/` y `src/hooks/core/`.

### `useSession`
- Archivo: `src/hooks/useSession.ts`
- Firma: `export const useSession = (): SessionType`
- Descripción: devuelve el contexto de sesión; lanza si el provider no existe.

### `useCrud<Entity>`
- Archivo: `src/hooks/core/useCrud.ts`
- Input: `{ service: AbstractService<Entity>, queryKey: string | string[], onUnauthorized?, onForbidden? }`
- Retorno: `{ create, update, remove, isCreating, isUpdating, isDeleting, createError, updateError, deleteError, useFindById, useFindByPath }`
- Integra `useMutation` (react-query) y hace `invalidateQueries` del `queryKey` cuando cambian datos.

Ejemplo de uso con servicio custom (`UserService`):

```ts
import useCrud from '@/hooks/core/useCrud'
import UserService from '@/services/api/custom/UserService'

const userService = new UserService()

const { create, update, remove, useFindById } = useCrud({
  service: userService,
  queryKey: ['users'],
  onUnauthorized: () => console.log('No autorizado'),
  onForbidden: () => console.log('Acceso denegado'),
})

await create({ payload: { username: 'nuevo', password: '1234' } })
const userQuery = useFindById({ id: 1 })
```

Ejemplo de uso con servicio core genérico:

```ts
import Service from '@/services/core/Service'
import useCrud from '@/hooks/core/useCrud'

const itemService = new Service<{ id?: number; name?: string }>({
  endpoint: '/items',
})

const { create, update, remove, useFindById } = useCrud({
  service: itemService,
  queryKey: ['items'],
})

- El hook pasa `onUnauthorized` / `onForbidden` a las llamadas de mutación y consultas.
- También puedes sobrescribirlos por llamada individual usando `config`.

await create({
  payload: { name: 'nuevo' },
  config: {
    onUnauthorized: () => console.log('redirigir a login'),
    onForbidden: () => console.log('mostrar mensaje de permisos'),
  },
})

### `useFindAll<Entity>`
- Archivo: `src/hooks/core/useFindAll.ts`
- Propósito: obtener listas paginadas; devuelve `UseQueryResult` aumentado con `finalQueryKey` y helpers `addItemInCache`, `updateItemInCache`, `removeItemInCache`, `emptyCache`.

Ejemplo con servicio custom:

```ts
import useFindAll from '@/hooks/core/useFindAll'
import UserService from '@/services/api/custom/UserService'

const userService = new UserService()
const usersQuery = useFindAll({
  service: userService,
  endpoint: '/users',
  queryKey: ['users'],
  queryParams: { page: 1, pageSize: 20 },
  onUnauthorized: () => console.log('redirigir a login'),
  onForbidden: () => console.log('mostrar aviso de permisos'),
})
```

Ejemplo con servicio genérico:

```ts
import Service from '@/services/core/Service'
import useFindAll from '@/hooks/core/useFindAll'

const productService = new Service<{ id?: number; name?: string }>({
  endpoint: '/products',
})

const productsQuery = useFindAll({
  service: productService,
  endpoint: '/products',
  queryKey: ['products'],
  queryParams: { page: 1, pageSize: 10 },
  onUnauthorized: () => console.log('redirigir a login'),
  onForbidden: () => console.log('mostrar aviso de permisos'),
})
```

### `useInfiniteFindAll<Entity>`
- Archivo: `src/hooks/core/useInfiniteFindAll.ts`
- Propósito: paginación infinita con `useInfiniteQuery`; incluye helpers análogos para gestionar cache infinita.

Ejemplo de uso:

```ts
import useInfiniteFindAll from '@/hooks/core/useInfiniteFindAll'
import Service from '@/services/core/Service'

const productService = new Service<{ id?: number; name?: string }>({
  endpoint: '/products',
})

const infiniteProducts = useInfiniteFindAll({
  service: productService,
  endpoint: '/products',
  queryKey: ['products', 'infinite'],
  queryParams: { pageSize: 20 },
  onUnauthorized: () => console.log('redirigir a login'),
  onForbidden: () => console.log('mostrar aviso de permisos'),
  getNextPageParam: (lastPage) => lastPage.pagination.nextCursor || undefined,
})
```

### `useQueryParams<const T extends readonly string[]>`
- Archivo: `src/hooks/core/useQueryParams.ts`
- Firma: `useQueryParams(querys)` → `{ params, setUrlParam, removeUrlParam, setUrlParams }`
- Propósito: manipular parámetros de la URL de forma tipada y segura.

Ejemplo:

```ts
const { params, setUrlParam, removeUrlParam } = useQueryParams(['page', 'search'])
setUrlParam('search', 'react')
```

### `useRecoilStorage<T>`
- Archivo: `src/hooks/core/useRecoilStorage.ts`
- Propósito: atomFamily y efecto para persistencia cifrada en `localStorage` usando `zod` para validación y `CryptoJS.AES` para cifrado.
- Firma: `useRecoilStorage<T>(key: string, defaultValue?: T) => [state, setState]`

---

## Provider de sesión `SessionProvider`
- Archivo: [src/context/providers/SessionProvider.tsx](src/context/providers/SessionProvider.tsx)
- Proporciona el contexto `SessionContext` con las siguientes funciones y estado:
  - `profile`: `User | undefined` (query `queryKeys.session` usando `userService.profile()`)
  - `login(payload: { username, password })` — mutation que llama `userService.login`
  - `signup(payload: User)` — mutation que llama `userService.signUp`
  - `saveSession({ token, data })` — guarda token en `appSettings` y setea `queryClient` con la sesión, luego navega a `/dashboard`.
  - `logout()` — borra token, limpia cache de sesión y redirige a `/login`.
  - `loading`: estados para `profile`, `login`, `signup`.

Comportamiento adicional: si no hay token y no está en `/login`, redirige automáticamente al login.

---

## Cómo crear y usar un servicio (recapitulación y ejemplo)

1. Crear el modelo en `src/models/api/entities/` (ej. `MyEntity.ts`).
2. Crear el servicio extendiendo `Service<MyEntity>` en `src/services/api/custom/MyEntityService.ts`:

```ts
import MyEntity from '@/models/api/entities/MyEntity'
import Service from '@/services/core/Service'
import { appSettings } from '@/AppSettings'

export default class MyEntityService extends Service<MyEntity> {
  constructor() { super({ origin: appSettings.apiService, endpoint: '/my-entities' }) }

  public async special(payload: Partial<MyEntity>) {
    const res = await this.axios.post('/my-entities/special', payload)
    return res.data
  }
}

// Uso
const svc = new MyEntityService()
await svc.findAll({ endpoint: '/my-entities' })
```

3. (Opcional) Crear hooks que reusen utilidades: `useFindAll({ service: svc, queryKey: 'my-entities' })` o usar `useCrud`.

4. Cuando se necesiten handlers de autorización locales, pasar `config: { onUnauthorized: () => void, onForbidden: () => void }` en cada llamada.

---

## Backends de prueba recomendados

Para probar este frontend con un backend compatible, puedes usar estos repositorios:

- https://github.com/Loza64/spring-app-template.git
- https://github.com/Loza64/nestjs-app-template.git

Ambos templates sirven como API de ejemplo que exponen rutas REST compatibles con este frontend.

> Configura `VITE_API_URL` en `.env` para apuntar al backend local, por ejemplo `http://localhost:4000`.

---

## Buenas prácticas y recomendaciones
- Centraliza la lógica de tokens en `appSettings` y `axiosInstance`.
- Mantén DTOs sincronizados con el backend; versiona la API si es requerido.
- Evita lógica de negocio en componentes: usar hooks o services para facilitar tests.
- Usa `useCrud` para operaciones CRUD estándar y `useFindAll` / `useInfiniteFindAll` para listados.
- Usa `onUnauthorized`/`onForbidden` para tratar situaciones específicas sin romper la lógica global.

---

## Archivos de referencia (ubicaciones rápidas)
- `package.json` — scripts y deps [package.json](package.json)
- `tsconfig.json` — paths y `strict` [tsconfig.json](tsconfig.json)
- `vite.config.ts` — Vite config y proxy [vite.config.ts](vite.config.ts)
- `src/App.tsx` — providers principales [src/App.tsx](src/App.tsx#L1-L50)
- `src/main.tsx` — bootstrap [src/main.tsx](src/main.tsx#L1-L20)
- `src/services/core/Service.ts` — implementación genérica [src/services/core/Service.ts](src/services/core/Service.ts)
- `src/services/api/custom/UserService.ts` — ejemplo de servicio [src/services/api/custom/UserService.ts](src/services/api/custom/UserService.ts)
- `src/services/utils/axiosInstance.ts` — instancia axios [src/services/utils/axiosInstance.ts](src/services/utils/axiosInstance.ts)
- `src/lib/queryClient.ts` — query client y keys [src/lib/queryClient.ts](src/lib/queryClient.ts)
- Hooks: [src/hooks](src/hooks)
- Models: [src/models](src/models)

---