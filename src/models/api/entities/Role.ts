import type { RoleName } from "@/enum/role"
import type Permissions from "./Permissions"

export default interface Role {
    id?: number
    name: RoleName
    permissions?: Permissions[]
}