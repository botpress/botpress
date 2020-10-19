const ALL_SLOTS_REGEX = /\[(.+?)\]\(([\w_\. :-]+)\)/gi

export default function extractVariables(text: string) {
  const slotMatches: RegExpExecArray[] = []
  let matches: RegExpExecArray | null
  while ((matches = ALL_SLOTS_REGEX.exec(text)) !== null) {
    slotMatches.push(matches)
  }
  return slotMatches.map(s => s[2])
}
