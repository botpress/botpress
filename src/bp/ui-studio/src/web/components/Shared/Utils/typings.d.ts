import { IconName, MaybeElement, Position } from '@blueprintjs/core'
import React from 'react'

declare module 'botpress/utils' {
  export function ElementPreview(props: ElementPreviewProps): JSX.Element
  export function Downloader(props: DownloaderProps): JSX.Element
  export function toastFailure(message: string): void
  export function toastSuccess(message: string): void
  export function toastInfo(message: string): void
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
