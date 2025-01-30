import { File as FileEntity, Folder as FolderEntity } from 'definitions'

// Entities:
type File = FileEntity.InferredType
type BareMinimumFile = PartialExcept<File, 'path'>
type Folder = FolderEntity.InferredType
type BareMinimumFolder = PartialExcept<Folder, 'path'>

// Action requests:

// Type utilities:

/** Like Pick<T,K>, but each property is required */
type PickRequired<T, K extends keyof T> = { [P in K]-?: T[P] }
/** Makes all properties of T optional, except K, which are all required */
type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & PickRequired<T, K>
