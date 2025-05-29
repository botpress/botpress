export function box(lines: string[], width = 60): string {
  const top = `╔${'═'.repeat(width)}╗`
  const sep = `╠${'═'.repeat(width)}╣`
  const bottom = `╚${'═'.repeat(width)}╝`

  const paddedLines = lines.map((line) => {
    // eslint-disable-next-line no-control-regex
    const raw = line.replace(/\x1b\[[0-9;]*m/g, '') // Strip ANSI for length
    const padding = width - raw.length
    return `║${line}${' '.repeat(padding)}║`
  })

  return [top, ...paddedLines.slice(0, 1), sep, ...paddedLines.slice(1), bottom].join('\n')
}
