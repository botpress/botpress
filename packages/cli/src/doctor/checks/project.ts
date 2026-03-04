import fs from 'fs'
import path from 'path'
import type { DiagnosticIssue } from '../types'
import { _createIssue, CATEGORY_PROJECT } from './commons'

/**
 * Runs all project structure checks in parallel and collects diagnostic issues
 * @param workDir - The working directory to run checks against
 * @returns Array of all diagnostic issues found across all project checks
 */
export async function runProjectChecks(workDir: string): Promise<DiagnosticIssue[]> {
  const results = await Promise.all([
    _checkPackageJson(workDir),
    _checkProjectType(workDir),
    _checkProjectStructure(workDir),
    _checkPackageScripts(workDir),
    _checkDependencies(workDir),
  ])

  return results.flat()
}

async function _checkPackageJson(workDir: string): Promise<DiagnosticIssue[]> {
  const packageJsonPath = path.join(workDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return [
      _createIssue(
        'package-json-missing',
        CATEGORY_PROJECT,
        'error',
        'package.json file is missing',
        { workDir },
        'Create a package.json file in the project root with `npm init` or `pnpm init`'
      ),
    ]
  }

  try {
    const content = await fs.promises.readFile(packageJsonPath, 'utf-8')
    const pkg = JSON.parse(content)

    const issues: DiagnosticIssue[] = []

    if (!pkg.name) {
      issues.push(
        _createIssue(
          'package-json-no-name',
          CATEGORY_PROJECT,
          'error',
          'package.json is missing the "name" field',
          { path: packageJsonPath },
          'Add a "name" field to your package.json'
        )
      )
    }

    if (!pkg.version) {
      issues.push(
        _createIssue(
          'package-json-no-version',
          CATEGORY_PROJECT,
          'warning',
          'package.json is missing the "version" field',
          { path: packageJsonPath },
          'Add a "version" field to your package.json'
        )
      )
    }

    if (issues.length === 0) {
      issues.push(
        _createIssue('package-json', CATEGORY_PROJECT, 'ok', 'package.json is present and valid', {
          name: pkg.name,
          version: pkg.version,
          type: pkg.type || 'commonjs',
        })
      )
    }

    return issues
  } catch (error) {
    return [
      _createIssue(
        'package-json-invalid',
        CATEGORY_PROJECT,
        'error',
        'package.json is not valid JSON',
        {
          path: packageJsonPath,
          error: error instanceof Error ? error.message : String(error),
        },
        'Fix the JSON syntax errors in package.json'
      ),
    ]
  }
}

async function _checkProjectType(workDir: string): Promise<DiagnosticIssue[]> {
  const integrationDefTs = path.join(workDir, 'integration.definition.ts')
  const integrationDefJs = path.join(workDir, 'integration.definition.js')

  if (fs.existsSync(integrationDefTs) || fs.existsSync(integrationDefJs)) {
    return [
      _createIssue('project-type', CATEGORY_PROJECT, 'ok', 'Botpress integration project detected', {
        type: 'integration',
        definitionFile: fs.existsSync(integrationDefTs) ? 'integration.definition.ts' : 'integration.definition.js',
      }),
    ]
  }

  const botDefTs = path.join(workDir, 'bot.definition.ts')
  const botDefJs = path.join(workDir, 'bot.definition.js')

  if (fs.existsSync(botDefTs) || fs.existsSync(botDefJs)) {
    return [
      _createIssue('project-type', CATEGORY_PROJECT, 'ok', 'Botpress bot project detected', {
        type: 'bot',
        definitionFile: fs.existsSync(botDefTs) ? 'bot.definition.ts' : 'bot.definition.js',
      }),
    ]
  }

  const pluginDefTs = path.join(workDir, 'plugin.definition.ts')
  const pluginDefJs = path.join(workDir, 'plugin.definition.js')

  if (fs.existsSync(pluginDefTs) || fs.existsSync(pluginDefJs)) {
    return [
      _createIssue('project-type', CATEGORY_PROJECT, 'ok', 'Botpress plugin project detected', {
        type: 'plugin',
        definitionFile: fs.existsSync(pluginDefTs) ? 'plugin.definition.ts' : 'plugin.definition.js',
      }),
    ]
  }

  return [
    _createIssue(
      'project-type-unknown',
      CATEGORY_PROJECT,
      'warning',
      'Unknown project type (no definition file found)',
      { workDir },
      'Create an integration.definition.ts, bot.definition.ts, or plugin.definition.ts file to define your project type'
    ),
  ]
}

async function _checkProjectStructure(workDir: string): Promise<DiagnosticIssue[]> {
  const issues: DiagnosticIssue[] = []

  const srcDir = path.join(workDir, 'src')
  if (!fs.existsSync(srcDir)) {
    issues.push(
      _createIssue(
        'src-dir-missing',
        CATEGORY_PROJECT,
        'warning',
        'src/ directory not found',
        { workDir },
        'Create a src/ directory for your source code'
      )
    )
  } else {
    const entryFiles = ['src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js']
    const entryFileExists = entryFiles.some((file) => fs.existsSync(path.join(workDir, file)))

    if (!entryFileExists) {
      issues.push(
        _createIssue(
          'entry-file-missing',
          CATEGORY_PROJECT,
          'warning',
          'No entry file found in src/ directory',
          { workDir, checkedFiles: entryFiles },
          'Create an index.ts or index.js file in the src/ directory'
        )
      )
    } else {
      const foundEntry = entryFiles.find((file) => fs.existsSync(path.join(workDir, file)))
      issues.push(
        _createIssue('project-structure', CATEGORY_PROJECT, 'ok', 'Project structure looks good', {
          srcDir: true,
          entryFile: foundEntry,
        })
      )
    }
  }

  const tsconfigPath = path.join(workDir, 'tsconfig.json')
  if (!fs.existsSync(tsconfigPath)) {
    issues.push(
      _createIssue(
        'tsconfig-missing',
        CATEGORY_PROJECT,
        'warning',
        'tsconfig.json not found',
        { workDir },
        'Create a tsconfig.json file if using TypeScript'
      )
    )
  } else {
    issues.push(_createIssue('tsconfig', CATEGORY_PROJECT, 'ok', 'tsconfig.json found', { path: tsconfigPath }))
  }

  return issues
}

async function _checkPackageScripts(workDir: string): Promise<DiagnosticIssue[]> {
  const packageJsonPath = path.join(workDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  try {
    const content = await fs.promises.readFile(packageJsonPath, 'utf-8')
    const pkg = JSON.parse(content)

    const isIntegration =
      fs.existsSync(path.join(workDir, 'integration.definition.ts')) ||
      fs.existsSync(path.join(workDir, 'integration.definition.js'))
    const isBot =
      fs.existsSync(path.join(workDir, 'bot.definition.ts')) || fs.existsSync(path.join(workDir, 'bot.definition.js'))
    const isPlugin =
      fs.existsSync(path.join(workDir, 'plugin.definition.ts')) ||
      fs.existsSync(path.join(workDir, 'plugin.definition.js'))

    if (!isIntegration && !isBot && !isPlugin) {
      return []
    }

    const scripts = pkg.scripts || {}
    const recommendedScripts = ['build', 'dev']
    const missingScripts = recommendedScripts.filter((script) => !scripts[script])

    if (missingScripts.length > 0) {
      return [
        _createIssue(
          'scripts-missing',
          CATEGORY_PROJECT,
          'warning',
          `Missing recommended scripts: ${missingScripts.join(', ')}`,
          {
            missingScripts,
            availableScripts: Object.keys(scripts),
          },
          'Add recommended scripts to package.json. Example: "build": "bp build", "dev": "bp dev"'
        ),
      ]
    }

    return [
      _createIssue('scripts', CATEGORY_PROJECT, 'ok', 'Recommended scripts are present', {
        scripts: Object.keys(scripts),
      }),
    ]
  } catch {
    return []
  }
}

async function _checkDependencies(workDir: string): Promise<DiagnosticIssue[]> {
  const packageJsonPath = path.join(workDir, 'package.json')

  if (!fs.existsSync(packageJsonPath)) {
    return []
  }

  try {
    const content = await fs.promises.readFile(packageJsonPath, 'utf-8')
    const pkg = JSON.parse(content)

    const isIntegration =
      fs.existsSync(path.join(workDir, 'integration.definition.ts')) ||
      fs.existsSync(path.join(workDir, 'integration.definition.js'))
    const isBot =
      fs.existsSync(path.join(workDir, 'bot.definition.ts')) || fs.existsSync(path.join(workDir, 'bot.definition.js'))
    const isPlugin =
      fs.existsSync(path.join(workDir, 'plugin.definition.ts')) ||
      fs.existsSync(path.join(workDir, 'plugin.definition.js'))

    if (!isIntegration && !isBot && !isPlugin) {
      return []
    }

    const dependencies = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
    const hasSdk = '@botpress/sdk' in dependencies

    if (!hasSdk) {
      return [
        _createIssue(
          'sdk-missing',
          CATEGORY_PROJECT,
          'warning',
          '@botpress/sdk not found in dependencies',
          { workDir },
          'Install @botpress/sdk: npm install @botpress/sdk or pnpm add @botpress/sdk'
        ),
      ]
    }

    return [
      _createIssue('dependencies', CATEGORY_PROJECT, 'ok', 'Required dependencies are present', {
        sdk: dependencies['@botpress/sdk'],
      }),
    ]
  } catch {
    return []
  }
}
