export interface ChangeItem {
  ChangeToken: { StringValue: string }
  // 1=Add 2=Update 3=Delete 4=Rename 5=MoveAway 6=MoveTo 7=Restore
  ChangeType: 1 | 2 | 3 | 4 | 5 | 6 | 7
  ItemId: number
}

export interface ChangeResponse {
  d: {
    results: ChangeItem[]
  }
}

export interface SharePointFile {
  Name: string
  ServerRelativeUrl: string
  Length: string
  TimeLastModified: string
  ETag: string
}

export type SharePointFilesResponse = {
  d: {
    __next?: string
    results: SharePointFile[]
  }
}

export interface SharePointFolder {
  Name: string
  ServerRelativeUrl: string
}

export type SharePointFoldersResponse = {
  d: {
    results: SharePointFolder[]
  }
}

export type SharePointListsResponse = {
  d: {
    results: Array<{
      Title: string
      RootFolder: {
        ServerRelativeUrl: string
      }
    }>
  }
}
