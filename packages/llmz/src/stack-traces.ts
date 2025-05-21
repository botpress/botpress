export function cleanStackTrace(stack: string) {
  const lines = stack.split('\n')

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]!
    let llmzIndex = line.indexOf('llmz/src/')

    if (llmzIndex === -1) {
      llmzIndex = line.indexOf('\\llmz\\src\\')
    }

    if (llmzIndex === -1) {
      continue
    }

    let lastSpaceIndex = line.lastIndexOf(' ', llmzIndex)

    if (lastSpaceIndex === -1) {
      lastSpaceIndex = 0
    }

    const maybeParen = line[lastSpaceIndex + 1] === '(' ? '(' : ''

    lines[i] = line.slice(0, lastSpaceIndex + 1) + maybeParen + line.slice(llmzIndex)
  }

  return lines.filter((x) => !x.includes('node_modules')).join('\n')
}
