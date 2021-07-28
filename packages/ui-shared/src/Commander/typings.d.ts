import { UserProfile } from 'common/typings'

interface GenericShortcut {
  label: string
  category?: 'studio' | 'admin' | 'module' | 'external' | 'command' | string
  shortcut?: string
  location?: 'studio' | 'admin'
  permission?: RequiredPermission
}

interface ShortcutRedirect extends GenericShortcut {
  type: 'goto' | 'redirect' | 'popup'
  url: string
}

interface ShortcutExecute extends GenericShortcut {
  type: 'execute'
  method: () => void
}

export type QuickShortcut = ShortcutRedirect | ShortcutExecute

export interface CommanderProps {
  location?: 'studio' | 'admin'
  shortcuts: QuickShortcut[]
  history: any
  user?: Pick<UserProfile, 'isSuperAdmin' | 'permissions'>
}

export interface Command {
  name: string
  command: () => void
}
