export interface I_UserFullName {
    firstName: string
    secondName: string
    lastName: string
}

export interface I_UserCreate extends I_UserFullName {
    login: string
    password: string
}

export interface I_User extends I_UserFullName {
    _id: string
}

export interface I_UserCredential {
    login: string
    password: string
}

export interface I_CurrentUser extends I_User {
    login: string
    created?: string
    isActive: boolean
    isSuper: boolean
}
