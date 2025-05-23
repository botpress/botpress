import { glob } from 'glob'
import { readFileSync, writeFileSync } from 'node:fs'

const files = glob.sync('src/**/*.md')

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const compiled = `export default ${JSON.stringify(content)}`
  writeFileSync(file + '.ts', compiled)
  console.log(`Compiled ${file} to ${file + '.ts'}`)
}
