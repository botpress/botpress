export const stripSubdomain = (input: string): string => {
  if (input.startsWith('https://') && input.endsWith('.zendesk.com')) {
    return input.substring('https://'.length, input.length - '.zendesk.com'.length)
  }
  if (input.startsWith('http://') && input.endsWith('.zendesk.com')) {
    return input.substring('http://'.length, input.length - '.zendesk.com'.length)
  }
  if (input.endsWith('.zendesk.com')) {
    return input.substring(0, input.length - '.zendesk.com'.length)
  }
  return input
}
