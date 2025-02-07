import { SnapshotSerializer } from 'vitest'

const seen = new Set<string>()

const serializer = {
  serialize(val: string, config, indentation, depth, refs, printer) {
    const pretty = val
      .split('\n')
      .map((line) => {
        if (/\^{2,}/.test(line)) {
          return '...' + line.trim()
        }
        return line
      })
      .join('\n')
    return printer(pretty, config, indentation, depth, refs)
  },
  test(val) {
    if (typeof val === 'string') {
      const lines = val.split('\n').filter((line) => !!line.trim().length)
      const isStack = lines.length > 1 && lines.every((line) => /(\d\d\d \|)|(^\s+\^{2,}$)/i.test(line))

      if (seen.has(val)) {
        return false
      }

      seen.add(val)
      return isStack
    }

    return false
  }
} satisfies SnapshotSerializer

export default serializer as unknown
