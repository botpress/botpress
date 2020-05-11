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

const positionSuggestions = ({ state, props }) => {

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
    transform,
    transformOrigin: '1em 0%',
    transition
  }
}

export default positionSuggestions
