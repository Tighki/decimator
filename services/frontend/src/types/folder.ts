import {I_UserFullName} from "./user";

export interface I_Reserve {
    id: string
    from_: number
    to_: number
    authorId: string
    authorFullName: I_UserFullName
    description: string
    created: string
}

export interface I_Folder {
    _id: string
    name: string
    folderGroupId: string
    reserves: I_Reserve[]
}
