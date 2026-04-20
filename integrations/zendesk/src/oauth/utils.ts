export const stripSubdomain = (input: string): string => {
  const trimedInput = input.trim()

  if (trimedInput.startsWith('https://') && trimedInput.endsWith('.zendesk.com')) {
    return trimedInput.substring('https://'.length, trimedInput.length - '.zendesk.com'.length)
  }
  if (trimedInput.startsWith('http://') && trimedInput.endsWith('.zendesk.com')) {
    return trimedInput.substring('http://'.length, trimedInput.length - '.zendesk.com'.length)
  }
  if (trimedInput.endsWith('.zendesk.com')) {
    return trimedInput.substring(0, trimedInput.length - '.zendesk.com'.length)
  }
  return trimedInput
}
