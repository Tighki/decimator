import {I_UserFullName} from "./user";

export interface I_Document {
    _id: string
    authorId: string
    folderId: string
    authorFullName: I_UserFullName
    comment?: string
    created: string
    project: string
    number: number
    version?: string
}
