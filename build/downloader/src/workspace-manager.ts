import 'bluebird-global'
import chalk from 'chalk'
import { exec } from 'child_process'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import path from 'path'

interface RunCommand {
  repo: string
  label: string
  cmd: string
  env?: any
  cwd: string
}

interface SetupRepository {
  cloneRepo?: boolean
  checkoutBranch?: string
  forceCheckout?: boolean
  buildAsPro?: boolean
}

const tryExecute = async (cmd, opts, isVerbose) => {
  await Promise.fromCallback(cb => {
    const proc = exec(cmd, opts, cb)
    if (isVerbose) {
      proc.stdout.pipe(process.stdout)
      proc.stderr.pipe(process.stderr)
    }
  })
}

export const setDotEnvComment = async (varName: string, isEnabled: boolean, outputFolder: string) => {
  const dotEnvFile = path.resolve(outputFolder, '.env')
  if (!(await fse.pathExists(dotEnvFile))) {
    return
  }

  const content = await fse.readFile(dotEnvFile, 'utf-8')
  const envRegexp = new RegExp(`#?${varName}=(.*)`)

  const result = content.split('\n').map(line => {
    const match = line.match(envRegexp)
    return match ? `${isEnabled ? '' : '# '}${varName}=${match[1]}` : line
  })

  await fse.writeFile(dotEnvFile, result.join('\n'), 'utf-8')
}

const log = (text: string, eraseLine?: boolean) => {
  process.stdout.write(`${text}${eraseLine ? '\r' : '\n'}`)
}

const repositories = ['botpress', 'messaging', 'studio', 'nlu']

export const getManager = (argv): WorkspaceManager => {
  return new WorkspaceManager(argv.workspace, argv.verbose, argv.skipBuild, argv.quickBuild)
}

export class WorkspaceManager {
  constructor(
    private rootFolder: string,
    private verbose: boolean,
    private skipBuild: boolean,
    private quickBuild?: boolean
  ) {}

  initializeWorkspace = async ({ usePro }: { usePro: boolean }) => {
    if (await this.rootPathExists()) {
      console.error('Cannot initialize a new workspace in an existing path')
      process.exit(0)
    }

    await mkdirp.sync(this.rootFolder)
    await fse.writeFile(path.join(this.rootFolder, '.workspace'), '')

    for (const repo of repositories) {
      await this.setupRepository(repo, { cloneRepo: true, buildAsPro: repo === 'botpress' && usePro })
    }

    await this.createDotEnv()
  }

  /**
   * Synchronizing a workspace will checkout any dev branches configured in package.json
   */
  async syncWorkspace({ forceCheckout, devMode }: { forceCheckout: boolean; devMode: boolean }) {
    if (!(await this.rootPathExists())) {
      console.error('To sync a workspace, the path must exist')
      process.exit(0)
    }

    const packageJson = await fse.readJson(path.resolve(this.rootFolder, 'botpress/package.json'))
    for (const repo of repositories) {
      const config = packageJson[repo]

      if (devMode) {
        const envVar = `DEV_${repo}_PATH`.toUpperCase()
        await setDotEnvComment(envVar, true, `${this.rootFolder}/${repo}`)
      }

      if (config && (config?.devBranch || forceCheckout)) {
        await this.setupRepository(repo, { checkoutBranch: config?.devBranch || 'master', forceCheckout })
      }
    }
  }

  async checkoutBranch(branchName: string, repo: string, cwd: string, forceCheckout?: boolean) {
    await this.runCommand({
      repo,
      label: `Checkout ${branchName}`,
      cmd: `git checkout ${forceCheckout ? '-f' : ''} ${branchName}`,
      cwd
    })
  }

  setupRepository = async (repo: string, { cloneRepo, buildAsPro, forceCheckout, checkoutBranch }: SetupRepository) => {
    log(chalk.magenta(`Setting up ${repo}...`))

    if (cloneRepo) {
      await this.runCommand({
        repo,
        label: 'Cloning repository',
        cmd: `git clone https://github.com/botpress/${repo}.git`,
        cwd: this.rootFolder
      })
    }

    const cwd = `${this.rootFolder}/${repo}`

    if (checkoutBranch) {
      await this.runCommand({
        repo,
        label: `Checkout ${checkoutBranch}`,
        cmd: `git checkout ${forceCheckout ? '-f' : ''} ${checkoutBranch}`,
        cwd
      })
    }

    if (buildAsPro) {
      await this.createEmptyProFile()
    }

    await this.runCommand({ label: 'Fetching dependencies', repo, cmd: 'yarn', cwd })

    if (!this.skipBuild) {
      await this.runCommand({
        label: 'Building repository',
        repo,
        cmd: 'yarn build',
        cwd,
        env: { ...process.env, GULP_PARALLEL: this.quickBuild }
      })
    }

    log('')
  }

  async createEmptyProFile() {
    const proFile = path.resolve(this.rootFolder, 'botpress/pro')

    if (!(await fse.pathExists(proFile))) {
      await fse.writeFile(proFile, '')
    }
  }

  async createDotEnv() {
    const dotEnvDir = path.resolve(this.rootFolder, 'botpress/packages/bp/dist/')
    const fileContent = `### Linked Repositories
DEV_STUDIO_PATH=${this.rootFolder}/studio/packages/studio-be/out
DEV_NLU_PATH=${this.rootFolder}/nlu/packages/nlu-cli/dist
DEV_MESSAGING_PATH=${this.rootFolder}/messaging/packages/server/dist

### Connections
# DATABASE_URL=postgres://user:pw@localhost:5432/dbname
# BPFS_STORAGE=database
# CLUSTER_ENABLED=true
# REDIS_URL=redis://localhost:6379
# BP_REDIS_SCOPE=

### Server Setup
# BP_PRODUCTION=true
# PRO_ENABLED=true
# EXTERNAL_URL=http://localhost:3000
# BP_CONFIG_HTTPSERVER_PORT=3000
# BP_CONFIG_PRO_LICENSEKEY=your_license
# DEBUG=bp:*

### Migrations
# AUTO_MIGRATE=true
# TESTMIG_ALL=true
# TESTMIG_NEW=true

### Sandbox
# DISABLE_GLOBAL_SANDBOX=true
# DISABLE_BOT_SANDBOX=true
# DISABLE_TRANSITION_SANDBOX=true
# DISABLE_CONTENT_SANDBOX=true`

    mkdirp.sync(dotEnvDir)
    await fse.writeFile(path.resolve(dotEnvDir, '.env'), fileContent, 'utf-8')
  }

  async runCommand({ repo, label, cmd, env, cwd }: RunCommand) {
    const startTime = Date.now()
    const calcElapsed = () => `[${Math.round(Date.now() - startTime) / 1000} s]`

    log(`- [${repo}] ${label}...`, true)

    try {
      await tryExecute(cmd, { cwd, env }, this.verbose)
      log(`- [${repo}] ${label}... ${chalk.green('Success')} ${calcElapsed()}`, true)
    } catch (err) {
      log(`- [${repo}] ${label}... ${chalk.red(`Error: ${err.message}`)}`, true)
    }

    log('')
  }

  async rootPathExists() {
    return fse.pathExists(this.rootFolder)
  }
}
