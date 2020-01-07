import { IconName, MaybeElement, Position } from '@blueprintjs/core'
import React from 'react'
import { UserReducer } from '~/reducers/user'

declare module 'botpress/utils' {
  export function ElementPreview(props: ElementPreviewProps): JSX.Element
  export function Downloader(props: DownloaderProps): JSX.Element
  /** Small wrapper using isOperationAllowed to display childrens if the user is authorized */
  export function AccessControl(props: AccessControlProps): JSX.Element
  /** Check if a user has permission to access a specific resource */
  export function isOperationAllowed(props: PermissionAllowedProps): boolean
  export function toastFailure(message: string): void
  export function toastSuccess(message: string): void
  export function toastInfo(message: string): void
  export function reorderFlows(flows: any): any
  export function getFlowLabel(flowName: string): string
}

export interface DownloaderProps {
  /** When the URL is set, the backend is called and the download is started. */
  url: string
  /** If the filename is not set, it will be extracted from headers */
  filename?: string
  /** Trigger an action after the download is done */
  onDownloadCompleted?: () => void
}

export interface ElementPreviewProps {
  /** The ID of the content element to display */
  itemId: string
  readonly contentLang?: string
  readonly fetchContentItem?: (itemId: string) => void
  readonly contentItem?: any
}

export interface PermissionAllowedProps {
  /** The resource to check permissions. Ex: module.qna */
  resource?: string
  /** The operation to check */
  operation?: 'read' | 'write'
  /** Should the user be a super admin to see this? */
  superAdmin?: boolean
  /** If not set, it will be taken from the store.  */
  user?: UserReducer
}

export type AccessControlProps = {
  /** Component to display if user has the right access */
  readonly children: React.ReactNode
  /** Optionally set a fallback component if no access */
  readonly fallback?: React.ReactNode
} & PermissionAllowedProps
