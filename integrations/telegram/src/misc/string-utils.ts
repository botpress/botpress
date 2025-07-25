export const spliceText = (text: string, start: number, end: number, replacement: string) => {
  return text.substring(0, start) + replacement + text.substring(end)
}
