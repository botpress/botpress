const getRelativeParent = element => {
  if (!element) {
    return null
  }

  const position = window.getComputedStyle(element).getPropertyValue('position')
  if (position !== 'static') {
    return element
  }

  return getRelativeParent(element.parentElement)
}

const positionSuggestions = ({ decoratorRect, popover, state, props }) => {
  const relativeParent = getRelativeParent(popover.parentElement)
  const relativeRect = {}

  if (relativeParent) {
    relativeRect.scrollLeft = relativeParent.scrollLeft
    relativeRect.scrollTop = relativeParent.scrollTop

    const relativeParentRect = relativeParent.getBoundingClientRect()
    relativeRect.left = decoratorRect.left - relativeParentRect.left
    relativeRect.top = decoratorRect.bottom - relativeParentRect.top
  } else {
    relativeRect.scrollTop = window.pageYOffset || document.documentElement.scrollTop
    relativeRect.scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    relativeRect.top = decoratorRect.bottom
    relativeRect.left = decoratorRect.left
  }

  const left = relativeRect.left + relativeRect.scrollLeft
  const top = relativeRect.top + relativeRect.scrollTop

  let transform
  let transition
  if (state.isActive) {
    if (props.suggestions.length > 0) {
      transform = 'scale(1)'
      transition = 'all 0.25s cubic-bezier(.3,1.2,.2,1)'
    } else {
      transform = 'scale(0)'
      transition = 'all 0.35s cubic-bezier(.3,1,.2,1)'
    }
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
    transform,
    transformOrigin: '1em 0%',
    transition
  }
}

export default positionSuggestions
