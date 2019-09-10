import { IconName, MaybeElement, Position } from '@blueprintjs/core'
import React from 'react'
import { UserReducer } from '~/reducers/user'

declare module 'botpress/utils' {
  export function ElementPreview(props: ElementPreviewProps): JSX.Element
  export function Downloader(props: DownloaderProps): JSX.Element
  export function PermissionsChecker(props: PermissionsCheckerProps): JSX.Element
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

export interface PermissionsCheckerProps {
  /** The resource to check permissions. Ex: module.qna */
  resource: string
  /** The operation to check */
  operation: 'read' | 'write'
  /** Component to display if user has the right access */
  readonly children: React.ReactNode
  /** Optionally set a fallback component if no access */
  readonly fallback?: React.ReactNode
  /** The user is set automatically  */
  readonly user?: UserReducer
}
