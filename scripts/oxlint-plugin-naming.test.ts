import { execFile } from 'child_process'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
import { promisify } from 'util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '..')
const PLUGIN_PATH = path.join(REPOSITORY_ROOT, 'scripts/oxlint-plugin-naming.mjs')

type Diagnostic = { message: string; code: string }

/**
 * Lints a source file through oxlint itself rather than against a stub rule
 * context, so the member selector is matched against the real syntax tree.
 */
const lintSource = async (source: string): Promise<Diagnostic[]> => {
  const directory = await mkdtemp(path.join(tmpdir(), 'oxlint-naming-'))
  try {
    const configPath = path.join(directory, 'oxlintrc.json')
    const sourcePath = path.join(directory, 'subject.ts')
    await Promise.all([
      writeFile(
        configPath,
        JSON.stringify({
          plugins: ['typescript'],
          jsPlugins: [PLUGIN_PATH],
          rules: { 'naming/private-member-underscore': 'error' },
        })
      ),
      writeFile(sourcePath, source),
    ])

    const { stdout } = await execFileAsync('oxlint', ['-c', configPath, '--format', 'json', sourcePath], {
      cwd: REPOSITORY_ROOT,
      env: { ...process.env, PATH: `${REPOSITORY_ROOT}/node_modules/.bin:${process.env.PATH}` },
    }).catch((thrown: unknown) => thrown as { stdout: string })

    return (JSON.parse(stdout).diagnostics as Diagnostic[]).filter((d) => d.code.startsWith('naming('))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const flaggedNames = (diagnostics: Diagnostic[]): string[] =>
  diagnostics.map((d) => d.message.replace(/^Private member '(.+)' must.*$/, '$1'))

describe('oxlint naming plugin', () => {
  it('flags private members that lack a leading underscore', async () => {
    // Arrange
    const source = `export class Subject {
  private badField = 1
  private badMethod(): void {}
}`

    // Act
    const diagnostics = await lintSource(source)

    // Assert
    expect(flaggedNames(diagnostics)).toEqual(['badField', 'badMethod'])
  })

  it('accepts private members that lead with an underscore and are otherwise camelCase', async () => {
    // Arrange
    const source = `export class Subject {
  private _goodField = 1
  private _goodMethod(): void {}
  private _alsoGood2 = 2
}`

    // Act
    const diagnostics = await lintSource(source)

    // Assert
    expect(diagnostics).toEqual([])
  })

  it('ignores a private constructor, which the member selector excludes', async () => {
    // Arrange
    const source = `export class Subject {
  private constructor() {}
}`

    // Act
    const diagnostics = await lintSource(source)

    // Assert
    expect(diagnostics).toEqual([])
  })

  it('flags private constructor parameter properties, including one with a default', async () => {
    // Arrange
    const source = `export class Subject {
  public constructor(
    private badParam: string,
    private _goodParam: number,
    private badWithDefault: string = 'x',
    plain: boolean
  ) {
    void plain
  }
}`

    // Act
    const diagnostics = await lintSource(source)

    // Assert
    expect(flaggedNames(diagnostics)).toEqual(['badParam', 'badWithDefault'])
  })

  it('flags private accessors and getters', async () => {
    // Arrange
    const source = `export class Subject {
  private accessor badAccessor = 1
  private get badGetter(): number {
    return 1
  }
  private set badSetter(v: number) {
    void v
  }
}`

    // Act
    const diagnostics = await lintSource(source)

    // Assert
    expect(flaggedNames(diagnostics)).toEqual(['badAccessor', 'badGetter', 'badSetter'])
  })

  it('ignores members that are not private', async () => {
    // Arrange
    const source = `export class Subject {
  public badName = 1
  protected alsoBad = 2
  untouched = 3
  public badMethod(): void {}
}`

    // Act
    const diagnostics = await lintSource(source)

    // Assert
    expect(diagnostics).toEqual([])
  })

  it.for([
    { case: 'an underscore followed by a capital', name: '_BadCase' },
    { case: 'a bare underscore', name: '_' },
    { case: 'two leading underscores', name: '__doubled' },
    { case: 'snake case after the underscore', name: '_snake_case' },
  ])('flags $case', async ({ name }) => {
    // Arrange
    const source = `export class Subject {
  private ${name} = 1
}`

    // Act
    const diagnostics = await lintSource(source)

    // Assert
    expect(flaggedNames(diagnostics)).toEqual([name])
  })
})
