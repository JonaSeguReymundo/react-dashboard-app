export const roles = {
    admin: 'super admin',
    all: '*'
} as const

export type RoleName = (typeof roles)[keyof typeof roles]