import React from 'react'

export interface MainContainerProps {
  /** Register a new combination of keyboard shortcuts for your container, for ex: ctrl+b, ctrl+alt+z, esc */
  keyMap?: {
    [id: string]: string
  }
  /** Makes the content scrollable vertically on overflow */
  yOverflowScroll?: boolean
  /** Add handlers for existing combinations in keyboardShortcuts.js, or create custom ones in combination to keyMap  */
  keyHandlers?: {
    [id: string]: (keyEvent?: KeyboardEvent) => void
  }
  readonly children: React.ReactNode
}
