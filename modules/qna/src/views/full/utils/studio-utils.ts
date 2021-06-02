// Copied from studio, eventually the qna module will be merged in the studio
export const reorderFlows = flows =>
  [
    flows.find(x => getName(x) === 'main'),
    flows.find(x => getName(x) === 'error'),
    flows.find(x => getName(x) === 'timeout'),
    ...flows.filter(x => !['main', 'error', 'timeout'].includes(getName(x)))
  ].filter(x => Boolean(x))

const getName = x => (x.id || x.name || x).replace(/\.flow\.json$/i, '')

export const getFlowLabel = (name: string) => {
  name = name.replace(/\.flow\.json$/i, '')
  if (name === 'main') {
    return 'Main'
  } else if (name === 'error') {
    return 'Error handling'
  } else if (name === 'timeout') {
    return 'Timeout'
  } else {
    return name
  }
}
