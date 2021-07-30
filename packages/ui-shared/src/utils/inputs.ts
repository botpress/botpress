export const isInputFocused = () => {
  if (!document.activeElement) {
    return false
  }

  const tag = document.activeElement.tagName
  const isEditable = document.activeElement['isContentEditable'] || document.activeElement['contenteditable'] === 'true'
  const inputTypes = ['textarea', 'input']
  return (tag && inputTypes.includes(tag.toLowerCase())) || isEditable
}
