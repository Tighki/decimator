export interface I_OrganizationBase {
    name: string
    code: string
    address?: string
    phone?: string
    description?: string
}

export interface I_Organization extends I_OrganizationBase {
    _id: string
    created: string
    isActive: boolean
    canRead: string[]
    canWrite: string[]
}

export interface I_FolderGroupBase {
    orgId?: string
    name: string
    description?: string
}

export interface I_FolderGroup extends I_FolderGroupBase {
    _id: string
}
