const isInternalLine = (line: string) => {
  return line.includes('/llmz/') || line.includes('\\llmz\\src\\') || line.includes('node_modules')
}

export function cleanStackTrace(stack: string, cleanInternal = true) {
  let lines = stack.split('\n')
  const until = lines.findIndex((line) => isInternalLine(line))

  if (cleanInternal && until >= 0) {
    lines = lines.slice(0, until)
  } else {
    lines = lines.map((line) => {
      let llmzIndex = line.indexOf('/llmz/')

      if (llmzIndex === -1) {
        llmzIndex = line.indexOf('\\llmz\\')
      }

      if (llmzIndex === -1) {
        return line
      }

      let lastSpaceIndex = line.lastIndexOf(' ', llmzIndex)

      if (lastSpaceIndex === -1) {
        lastSpaceIndex = 0
      }

      const maybeParen = line[lastSpaceIndex + 1] === '(' ? '(' : ''

      return line.slice(0, lastSpaceIndex + 1) + maybeParen + line.slice(llmzIndex)
    })
  }

  return lines.join('\n')
}
