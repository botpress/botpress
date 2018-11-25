export default (text: string): string[] => {
  return text
    .trim()
    .split(' ')
    .filter(x => x.length > 0)
}
