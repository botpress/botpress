import { readFileSync } from 'node:fs'
import { measureCase } from './lib'

const caseName = process.argv[2]
if (!caseName) {
  console.error('Usage: measure-case.ts <caseName> [pathsJson]  (source read from stdin)')
  process.exit(1)
}

const paths = process.argv[3] ? JSON.parse(process.argv[3]) : undefined

try {
  process.stdout.write(JSON.stringify(measureCase(caseName, readFileSync(0, 'utf8'), paths)))
} catch (e) {
  console.error((e as Error).message)
  process.exit(1)
}
