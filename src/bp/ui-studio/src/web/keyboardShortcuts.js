const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

export const keyMap = {
  // Navigation to screens
  // PROPOSAL STAGE
  // 'go-flow-editor': 'g f',
  // 'go-nlu': 'g n',
  // 'go-content': 'g c',
  // 'go-emulator': 'g e',
  // 'go-module-qna': 'g m q',

  // Flow-Editor Actions
  'flow-add-node': `ctrl+a`,
  'flow-save': `ctrl+s`,
  'emulator-focus': `e`,
  'docs-toggle': `ctrl+h`,
  'lang-switcher': `ctrl+l`,
  'toggle-sidepanel': `ctrl+b`,
  'create-new': `ctrl+alt+n`,
  undo: 'ctrl+z',
  redo: 'ctrl+shift+z',
  cancel: 'esc'
}

export const isInputFocused = () => {
  if (!document.activeElement) {
    return false
  }

  const tag = document.activeElement.tagName
  const isEditable = document.activeElement.isContentEditable || document.activeElement.contenteditable === 'true'
  const inputTypes = ['textarea', 'input']
  return (tag && inputTypes.includes(tag.toLowerCase())) || isEditable
}
