const gradient = {
  0: [255, 0, 0],
  0.25: [255, 128, 0],
  0.5: [255, 195, 0],
  0.75: [255, 255, 0],
  1: [144, 238, 144]
}

export function getColorByPercent(percent) {
  const low = Math.max(0, Math.floor(percent / 0.25) * 0.25)
  const high = Math.min(1, Math.ceil(percent / 0.25) * 0.25)
  const ratio = Math.max(0, Math.min(1, (high - percent) / 0.25))
  return pickHex(gradient[low], gradient[high], ratio)
}

function pickHex(color1, color2, weight) {
  const p = weight
  const w = p * 2 - 1
  const w1 = (w / 1 + 1) / 2
  const w2 = 1 - w1
  return rgbToHex(
    Math.round(color1[0] * w1 + color2[0] * w2),
    Math.round(color1[1] * w1 + color2[1] * w2),
    Math.round(color1[2] * w1 + color2[2] * w2)
  )
}

function componentToHex(c) {
  const hex = c.toString(16)
  return hex.length == 1 ? '0' + hex : hex
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
}
