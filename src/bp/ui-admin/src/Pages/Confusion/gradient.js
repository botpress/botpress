import _ from 'lodash'

const gradient = {
  0: [255, 0, 0],
  0.25: [255, 128, 0],
  0.5: [255, 195, 0],
  0.75: [255, 255, 0],
  1: [144, 238, 144]
}

const componentToHex = c => (c.length == 1 ? '0' + c : c)

const curriedMultiplier = _.curry(_.multiply)

const rgbToHex = colors =>
  `#${colors
    .map(color => color.toString(16))
    .map(componentToHex)
    .join('')}`

function pickHex(color1, color2, weight) {
  const p = weight
  const w = p * 2 - 1

  const w1 = (w / 1 + 1) / 2
  const w2 = 1 - w1

  const colors = _.zipWith(color1.map(curriedMultiplier(w1)), color2.map(curriedMultiplier(w2)), (a, b) =>
    Math.round(a + b)
  )

  return rgbToHex(colors)
}

export function getColorByPercent(percent) {
  const low = Math.max(0, Math.floor(percent / 0.25) * 0.25)
  const high = Math.min(1, Math.ceil(percent / 0.25) * 0.25)
  const ratio = Math.max(0, Math.min(1, (high - percent) / 0.25))

  return pickHex(gradient[low], gradient[high], ratio)
}
