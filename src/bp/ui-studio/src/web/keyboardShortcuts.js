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
  'emulator-focus': `e`,
  'docs-toggle': `${navigationKey}+h`,
  'lang-switcher': `${navigationKey}+l`,
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
