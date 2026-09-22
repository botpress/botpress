import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const snippets = new Map()
for (const name of ['README.md', 'DOCS.md', 'ERRORS.md']) {
  const markdown = fs.readFileSync(path.join(root, name), 'utf8')
  for (const match of markdown.matchAll(/^```(?:ts|typescript)\n([\s\S]*?)^```/gm)) {
    const line = markdown.slice(0, match.index).split('\n').length
    const filename = path.join(root, 'src', '__documentation__', `${name}-${line}.ts`)
    snippets.set(filename, match[1])
  }
}
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
const options = { ...parsed.options, noEmit: true, paths: { llmz: [path.join(root, 'src', 'index.ts')] } }
const host = ts.createCompilerHost(options)
const readFile = host.readFile.bind(host)
const fileExists = host.fileExists.bind(host)
host.readFile = (filename) => snippets.get(filename) ?? readFile(filename)
host.fileExists = (filename) => snippets.has(filename) || fileExists(filename)
const program = ts.createProgram([...snippets.keys()], options, host)
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (filename) => filename,
      getCurrentDirectory: () => root,
      getNewLine: () => '\n',
    })
  )
  process.exitCode = 1
} else {
  console.log(`Type-checked ${snippets.size} documentation examples against src/index.ts.`)
}
