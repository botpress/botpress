const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
const controlKey = isMac ? 'command' : 'ctrl'

export { controlKey }

export const keyMap = {
  add: `${controlKey}+a`,
  save: `${controlKey}+s`,
  undo: `${controlKey}+z`,
  find: `${controlKey}+f`,
  redo: `${controlKey}+shift+z`,
  delete: ['backspace', 'del'],
  'emulator-focus': ['e', `${controlKey}+e`],
  'docs-toggle': `${controlKey}+h`,
  'lang-switcher': `${controlKey}+l`,
  'toggle-sidepanel': `${controlKey}+b`,
  'create-new': `${controlKey}+alt+n`,
  'bottom-bar': `${controlKey}+j`,
  cancel: 'esc',
  'go-flow': 'g f',
  'go-home': 'g h',
  'go-content': 'g c',
  'go-understanding': 'g u',
  'go-module-code': 'g m c',
  'go-module-qna': 'g m q',
  'go-module-testing': 'g m t',
  'go-module-analytics': 'g m a',
  'zoom-in': `${controlKey}+=`,
  'zoom-out': `${controlKey}+-`,
  'toggle-inspect': 'i n s p e c t'
}
