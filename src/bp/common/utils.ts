export const bytesToString = (bytes: number): string => {
  const units = ['bytes', 'kb', 'mb', 'gb', 'tb']
  const power = Math.log2(bytes)
  const unitNumber = Math.min(Math.floor(power / 10), 4)
  const significand = bytes / Math.pow(2, unitNumber * 10)

  return `${significand.toFixed(0)} ${units[unitNumber]}`
}
