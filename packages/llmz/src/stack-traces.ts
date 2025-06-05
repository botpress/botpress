const isInternalLine = (line: string) => {
  return line.includes('/llmz/') || line.includes('\\llmz\\src\\') || line.includes('node_modules')
}

export function cleanStackTrace(stack: string, cleanInternal = true) {
  const lines = stack.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    let llmzIndex = line.indexOf('/llmz/')

    if (llmzIndex === -1) {
      llmzIndex = line.indexOf('\\llmz\\')
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

  return lines.filter((x) => !cleanInternal || !isInternalLine(x)).join('\n')
}
