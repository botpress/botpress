const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

const navigationKey = isMac ? 'ctrl' : 'ctrl+shift'

export const keyMap = {
  // Navigation to screens
  // PROPOSAL STAGE
  // 'go-flow-editor': 'g f',
  // 'go-nlu': 'g n',
  // 'go-content': 'g c',
  // 'go-emulator': 'g e',
  // 'go-module-qna': 'g m q',

  // Flow-Editor Actions
  'flow-add-node': `${navigationKey}+a`,
  'flow-save': `${navigationKey}+s`,
  'emulator-toggle': `${navigationKey}+e`,
  cancel: 'esc'
}
