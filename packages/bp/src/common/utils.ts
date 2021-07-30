// '___' is a non-valid botId, but here acts as for "all bots"
// This is used in modules when they setup routes that work on a global level (they are not tied to a specific bot)
// Check the 'sso-login' module for an example
export const ALL_BOTS = '___'

export const bytesToString = (bytes: number): string => {
  const units = ['bytes', 'kb', 'mb', 'gb', 'tb']
  const power = Math.log2(bytes)
  const unitNumber = Math.min(Math.floor(power / 10), 4)
  const significand = bytes / Math.pow(2, unitNumber * 10)

  return `${significand.toFixed(0)} ${units[unitNumber]}`
}

export const sanitizeName = (text: string) =>
  text
    .replace(/\s|\t|\n/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '')
