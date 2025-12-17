export const stripSubdomain = (input: string): string => {
  return input.endsWith('.zendesk.com')
    ? input.substring('https://'.length, input.length - '.zendesk.com'.length)
    : input
}
