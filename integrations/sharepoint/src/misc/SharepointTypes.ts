export type SharePointItemsResponse = {
  d: {
    __next?: string
    results: SharePointItem[]
  }
}

export type SharePointItem = {
  __metadata: Metadata
  FirstUniqueAncestorSecurableObject: DeferredUri
  RoleAssignments: DeferredUri
  AttachmentFiles: DeferredUri
  ContentType: DeferredUri
  GetDlpPolicyTip: DeferredUri
  FieldValuesAsHtml: DeferredUri
  FieldValuesAsText: DeferredUri
  FieldValuesForEdit: DeferredUri
  File: DeferredUri
  Folder: DeferredUri
  LikedByInformation: DeferredUri
  ParentList: DeferredUri
  Properties: DeferredUri
  Versions: DeferredUri
  FileSystemObjectType: number
  Id: number
  ServerRedirectedEmbedUri: null | string
  ServerRedirectedEmbedUrl: string
  ContentTypeId: string
  Title: string
  OData__ColorTag: null | string
  ComplianceAssetId: null | string
  ID: number
  Modified: string // ISO date string
  Created: string // ISO date string
  AuthorId: number
  EditorId: number
  OData__UIVersionString: string
  Attachments: boolean
  GUID: string
}

export type Metadata = {
  id: string
  uri: string
  etag: string
  type: string
}

export type DeferredUri = {
  __deferred: {
    uri: string
  }
}

export interface ChangeResponse {
  d: {
    results: ChangeItem[]
  }
}

/*
  Due to reliability issues, Moves and Copies are not supported.
    - Copies would come in as create events for example, and would disrupt the uniqueness of the files.
    - Moves often don't receive webhook events.

  As a work around the user must Upload or Create the file instead.
*/
export interface ChangeItem {
  __metadata: Metadata
  ChangeToken: ChangeToken
  ChangeType: 1 | 2 | 3 | 4 | 5 | 6 | 7 // The entire enum is available at https://learn.microsoft.com/en-us/previous-versions/office/sharepoint-csom/ee543793(v=office.15)
  SiteId: string
  Time: string // ISO 8601 format
  Editor: string
  EditorEmailHint: string | null
  ItemId: number
  ListId: string
  ServerRelativeUrl: string
  SharedByUser: string | null
  SharedWithUsers: string | null
  UniqueId: string
  WebId: string
}

export interface ChangeToken {
  StringValue: string
}

export type SharePointItemResponse = {
  d: {
    __metadata: {
      id: string
      uri: string
      etag: string
      type: string
    }
    FirstUniqueAncestorSecurableObject: DeferredUri
    RoleAssignments: DeferredUri
    AttachmentFiles: DeferredUri
    ContentType: DeferredUri
    GetDlpPolicyTip: DeferredUri
    FieldValuesAsHtml: DeferredUri
    FieldValuesAsText: DeferredUri
    FieldValuesForEdit: DeferredUri
    File: DeferredUri
    Folder: DeferredUri
    LikedByInformation: DeferredUri
    ParentList: DeferredUri
    Properties: DeferredUri
    Versions: DeferredUri
    FileSystemObjectType: number
    Id: number
    ServerRedirectedEmbedUri: null | string
    ServerRedirectedEmbedUrl: string
    ContentTypeId: string
    Title: string
    OData__ColorTag: null | string
    ComplianceAssetId: null | string
    ID: number
    Modified: string // ISO date string
    Created: string // ISO date string
    AuthorId: number
    EditorId: number
    OData__UIVersionString: string
    Attachments: boolean
    GUID: string
  }
}

// Deferred loading references for related resources
interface Deferred {
  uri: string
}

// Main File interface representing each file object
export interface SharePointFile {
  __metadata: Metadata
  Author: { __deferred: Deferred }
  CheckedOutByUser: { __deferred: Deferred }
  EffectiveInformationRightsManagementSettings: { __deferred: Deferred }
  InformationRightsManagementSettings: { __deferred: Deferred }
  ListItemAllFields: { __deferred: Deferred }
  LockedByUser: { __deferred: Deferred }
  ModifiedBy: { __deferred: Deferred }
  Properties: { __deferred: Deferred }
  VersionEvents: { __deferred: Deferred }
  VersionExpirationReport: { __deferred: Deferred }
  Versions: { __deferred: Deferred }
  CheckInComment: string
  CheckOutType: number
  ContentTag: string
  CustomizedPageStatus: number
  ETag: string
  Exists: boolean
  ExistsAllowThrowForPolicyFailures: boolean
  ExistsWithException: boolean
  IrmEnabled: boolean
  Length: string
  Level: number
  LinkingUri: string | null
  LinkingUrl: string
  MajorVersion: number
  MinorVersion: number
  Name: string
  ServerRelativeUrl: string
  TimeCreated: string
  TimeLastModified: string
  Title: string | null
  UIVersion: number
  UIVersionLabel: string
  UniqueId: string
}

// Root response structure
export interface SharePointFilesResponse {
  d: {
    results: SharePointFile[]
  }
}
