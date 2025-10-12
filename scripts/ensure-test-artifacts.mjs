#!/usr/bin/env node
import { existsSync, lstatSync, readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const resolvePath = (relativePath) => path.resolve(root, relativePath)
const toAbsolute = (targetPath) => (path.isAbsolute(targetPath) ? targetPath : resolvePath(targetPath))
const formatRelative = (absolutePath) => path.relative(root, absolutePath) || '.'
const toRelative = (targetPath) => formatRelative(toAbsolute(targetPath))

const truthyEnvValues = new Set(['1', 'true', 'yes', 'on'])
const parseBoolean = (value) => truthyEnvValues.has((value ?? '').toLowerCase())
const parseList = (value) =>
  (value ?? '')
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)

const appendListValues = (set, values) => {
  for (const value of parseList(values)) {
    set.add(value)
  }
}

const baseOptions = {
  force: parseBoolean(process.env.BP_FORCE_TEST_ARTIFACTS),
  check: parseBoolean(process.env.BP_TEST_ARTIFACTS_CHECK),
  list: false,
  json: false,
  verbose: parseBoolean(process.env.BP_TEST_ARTIFACTS_VERBOSE),
  plan: false,
  deploy: parseBoolean(process.env.BP_TEST_ARTIFACTS_DEPLOY),
  help: false,
  only: new Set(),
  skip: new Set(),
}

appendListValues(baseOptions.only, process.env.BP_TEST_ARTIFACTS_ONLY)
appendListValues(baseOptions.skip, process.env.BP_TEST_ARTIFACTS_SKIP ?? process.env.BP_TEST_ARTIFACTS_EXCEPT)

const rawArgs = process.argv.slice(2)

const takeValue = (args, index) => {
  const [arg] = args.slice(index, index + 1)
  if (!arg) {
    return { value: undefined, nextIndex: index }
  }
  if (arg.includes('=')) {
    const [name, ...rest] = arg.split('=')
    return { value: rest.join('='), nextIndex: index + 1, consumedCurrent: name }
  }
  return { value: args[index + 1], nextIndex: index + 2, consumedCurrent: arg }
}

const options = { ...baseOptions }

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index]

  switch (arg) {
    case '--force':
    case '-f':
      options.force = true
      break
    case '--check':
      options.check = true
      break
    case '--list':
      options.list = true
      break
    case '--json':
      options.json = true
      break
    case '--plan':
      options.plan = true
      break
    case '--deploy':
    case '-d':
      options.deploy = true
      break
    case '--verbose':
    case '-v':
      options.verbose = true
      break
    case '--help':
    case '-h':
      options.help = true
      break
    case '--only':
    case '--only=': {
      const { value, nextIndex, consumedCurrent } = takeValue(rawArgs, index)
      if (!value) {
        console.error('❌ --only requires a value')
        process.exit(1)
      }
      appendListValues(options.only, value)
      if (consumedCurrent === '--only=') {
        index = nextIndex - 1
      } else {
        index = nextIndex - 1
      }
      break
    }
    case '--skip':
    case '--skip=':
    case '--except':
    case '--except=': {
      const { value, nextIndex } = takeValue(rawArgs, index)
      if (!value) {
        console.error('❌ --skip/--except requires a value')
        process.exit(1)
      }
      appendListValues(options.skip, value)
      index = nextIndex - 1
      break
    }
    default: {
      if (arg.startsWith('--only=')) {
        appendListValues(options.only, arg.slice('--only='.length))
        break
      }
      if (arg.startsWith('--skip=')) {
        appendListValues(options.skip, arg.slice('--skip='.length))
        break
      }
      if (arg.startsWith('--except=')) {
        appendListValues(options.skip, arg.slice('--except='.length))
        break
      }
      console.error(`❌ Unknown argument: ${arg}`)
      process.exit(1)
    }
  }
}

if (options.plan && options.check) {
  console.error('❌ --plan cannot be used together with --check')
  process.exit(1)
}

if (options.help) {
  console.log(`Usage: node ./scripts/ensure-test-artifacts.mjs [options]\n\nOptions:\n  -f, --force            Force regeneration even if artifacts look fresh\n      --check            Only validate, do not run build steps\n      --plan             Describe manual steps without executing them\n      --deploy           Run deployment steps after ensuring artifacts\n      --list             List available artifact tasks\n      --json             Output JSON summary at the end\n  -v, --verbose          Print executed commands\n      --only <ids>       Comma or space separated task identifiers to run\n      --skip <ids>       Comma or space separated task identifiers to skip\n  -h, --help             Show this help message`)
  process.exit(0)
}

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

const safeStat = (absolutePath) => {
  try {
    return statSync(absolutePath, { throwIfNoEntry: false }) ?? undefined
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return undefined
    }
    throw error
  }
}

const safeLstat = (absolutePath) => {
  try {
    return lstatSync(absolutePath, { throwIfNoEntry: false }) ?? undefined
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return undefined
    }
    throw error
  }
}

const isSubPath = (candidate, parent) =>
  candidate === parent || candidate.startsWith(`${parent}${path.sep}`)

const computeLatestMtime = (inputs, exclude = []) => {
  if (!inputs) {
    return undefined
  }

  const absoluteExcludes = new Set(toArray(exclude).map(toAbsolute))

  const isExcluded = (absolutePath) => {
    for (const excluded of absoluteExcludes) {
      if (isSubPath(absolutePath, excluded)) {
        return true
      }
    }
    return false
  }

  let latest

  const visit = (absolutePath) => {
    if (isExcluded(absolutePath)) {
      return
    }

    const stats = safeLstat(absolutePath)
    if (!stats) {
      return
    }

    if (stats.isSymbolicLink()) {
      const linkTargetStats = safeStat(absolutePath)
      if (linkTargetStats) {
        latest = Math.max(latest ?? Number.NEGATIVE_INFINITY, linkTargetStats.mtimeMs)
      }
      return
    }

    latest = Math.max(latest ?? Number.NEGATIVE_INFINITY, stats.mtimeMs)

    if (stats.isDirectory()) {
      for (const entry of readdirSync(absolutePath)) {
        visit(path.join(absolutePath, entry))
      }
    }
  }

  for (const input of toArray(inputs)) {
    visit(toAbsolute(input))
  }

  return latest === undefined || latest === Number.NEGATIVE_INFINITY ? undefined : latest
}

const computeOldestMtime = (outputs) => {
  let oldest

  for (const output of toArray(outputs)) {
    const stats = safeStat(toAbsolute(output))
    if (!stats) {
      return undefined
    }

    oldest = Math.min(oldest ?? Number.POSITIVE_INFINITY, stats.mtimeMs)
  }

  return oldest === undefined || oldest === Number.POSITIVE_INFINITY ? undefined : oldest
}

const tasks = [
  {
    id: 'integration-chat',
    aliases: ['chat-integration', '@botpresshub/chat'],
    description: 'Generate Chat integration artifacts',
    outputs: [
      'integrations/chat/src/gen/errors.ts',
      'integrations/chat/src/gen/metadata.json',
      'integrations/chat/src/gen/openapi.json',
    ],
    inputs: [
      'integrations/chat/openapi.ts',
      'integrations/chat/definitions',
      'integrations/chat/src',
    ],
    exclude: [
      'integrations/chat/node_modules',
      'integrations/chat/src/gen',
    ],
    ensureSteps: [['pnpm', '--filter', '@botpresshub/chat', 'generate']],
    deploy: {
      description: 'Deploy Chat integration',
      steps: [
        ['pnpm', '--filter', '@botpresshub/chat', 'deploy'],
      ],
    },
  },
  {
    id: 'package-chat-client',
    aliases: ['@botpress/chat', 'chat-client'],
    description: 'Generate & build @botpress/chat client artifacts',
    outputs: [
      'packages/chat-client/src/gen/client/index.ts',
      'packages/chat-client/src/gen/client/models.ts',
      'packages/chat-client/src/gen/signals/index.ts',
      'packages/chat-client/dist/index.mjs',
      'packages/chat-client/dist/index.cjs',
      'packages/chat-client/dist/index.d.ts',
    ],
    inputs: [
      'packages/chat-client/openapi.ts',
      'packages/chat-client/build.ts',
      'packages/chat-client/src',
      'packages/chat-client/tsconfig.json',
      'packages/chat-client/tsconfig.build.json',
      'packages/chat-client/package.json',
    ],
    exclude: [
      'packages/chat-client/node_modules',
      'packages/chat-client/src/gen',
      'packages/chat-client/dist',
    ],
    ensureSteps: [
      ['pnpm', '--filter', '@botpress/chat', 'generate'],
      ['pnpm', '--filter', '@botpress/chat', 'build'],
    ],
  },
  {
    id: 'package-client',
    aliases: ['@botpress/client'],
    description: 'Build @botpress/client package',
    outputs: [
      'packages/client/dist/index.mjs',
      'packages/client/dist/index.cjs',
      'packages/client/dist/index.d.ts',
    ],
    inputs: [
      'packages/client/openapi.ts',
      'packages/client/build.ts',
      'packages/client/src',
      'packages/client/tsconfig.json',
      'packages/client/tsconfig.build.json',
      'packages/client/package.json',
    ],
    exclude: [
      'packages/client/node_modules',
      'packages/client/dist',
    ],
    ensureSteps: [
      ['pnpm', '--filter', '@botpress/client', 'generate'],
      ['pnpm', '--filter', '@botpress/client', 'build'],
    ],
  },
  {
    id: 'package-sdk',
    aliases: ['@botpress/sdk'],
    description: 'Build @botpress/sdk package',
    outputs: [
      'packages/sdk/dist/index.mjs',
      'packages/sdk/dist/index.cjs',
      'packages/sdk/dist/index.d.ts',
    ],
    inputs: [
      'packages/sdk/build.ts',
      'packages/sdk/src',
      'packages/sdk/tsconfig.json',
      'packages/sdk/tsconfig.package.json',
      'packages/sdk/package.json',
    ],
    exclude: [
      'packages/sdk/node_modules',
      'packages/sdk/dist',
    ],
    ensureSteps: [['pnpm', '--filter', '@botpress/sdk', 'build']],
  },
]

const normalizeToken = (token) => token.toLowerCase()
const taskIdentifiers = (task) => [task.id, ...(task.aliases ?? []), task.description]

const matchToken = (token, task) => {
  const normalizedToken = normalizeToken(token)
  for (const identifier of taskIdentifiers(task)) {
    const candidate = identifier.toLowerCase()
    if (candidate === normalizedToken || candidate.includes(normalizedToken)) {
      return true
    }
  }
  return false
}

const selectTasks = (allTasks) => {
  const onlyTokens = new Set([...options.only].map(normalizeToken))
  const skipTokens = new Set([...options.skip].map(normalizeToken))
  const matchedOnly = new Set()
  const matchedSkip = new Set()

  const filtered = allTasks.filter((task) => {
    let shouldInclude = true

    if (skipTokens.size > 0) {
      for (const token of skipTokens) {
        if (matchToken(token, task)) {
          matchedSkip.add(token)
          shouldInclude = false
          break
        }
      }
      if (!shouldInclude) {
        return false
      }
    }

    if (onlyTokens.size > 0) {
      let matched = false
      for (const token of onlyTokens) {
        if (matchToken(token, task)) {
          matched = true
          matchedOnly.add(token)
        }
      }
      shouldInclude = matched
    }

    return shouldInclude
  })

  const unmatchedOnly = [...onlyTokens].filter((token) => !matchedOnly.has(token))
  const unmatchedSkip = [...skipTokens].filter((token) => !matchedSkip.has(token))

  return { filtered, unmatchedOnly, unmatchedSkip }
}

const { filtered: selectedTasks, unmatchedOnly, unmatchedSkip } = selectTasks(tasks)

if (options.list) {
  console.log('Available artifact tasks:')
  for (const task of tasks) {
    const identifiers = [task.id, ...(task.aliases ?? [])]
    console.log(`  • ${task.description} (${identifiers.join(', ')})`)
  }
  if (unmatchedOnly.length > 0) {
    console.warn(`⚠️  Ignored unknown --only filters: ${unmatchedOnly.join(', ')}`)
  }
  if (unmatchedSkip.length > 0) {
    console.warn(`⚠️  Ignored unknown --skip filters: ${unmatchedSkip.join(', ')}`)
  }
  process.exit(0)
}

if (unmatchedOnly.length > 0) {
  console.error(`❌ No tasks matched --only filters: ${unmatchedOnly.join(', ')}`)
  process.exit(1)
}

if (unmatchedSkip.length > 0) {
  console.warn(`⚠️  Ignored unknown --skip filters: ${unmatchedSkip.join(', ')}`)
}

if (selectedTasks.length === 0) {
  console.log('ℹ️  No artifact tasks matched the provided filters. Nothing to do.')
  process.exit(0)
}

const computeTaskState = (task) => {
  const inputList = toArray(task.inputs)
  const outputList = toArray(task.outputs)

  const missingInputs = inputList
    .filter((input) => !existsSync(toAbsolute(input)))
    .map((input) => toRelative(input))
  const missingOutputs = outputList
    .filter((output) => !existsSync(toAbsolute(output)))
    .map((output) => toRelative(output))

  const latestInputMtime = computeLatestMtime(task.inputs, task.exclude)
  const oldestOutputMtime = computeOldestMtime(task.outputs)

  const hasStaleOutputs =
    latestInputMtime !== undefined &&
    oldestOutputMtime !== undefined &&
    latestInputMtime > oldestOutputMtime

  return {
    missingInputs,
    missingOutputs,
    hasStaleOutputs,
    latestInputMtime,
    oldestOutputMtime,
  }
}

const hasIssues = (state) =>
  state.missingInputs.length > 0 || state.missingOutputs.length > 0 || state.hasStaleOutputs

const formatParts = (parts) => {
  if (parts.length === 0) {
    return ''
  }
  if (parts.length === 1) {
    return parts[0]
  }
  const [last, ...restReversed] = parts.slice().reverse()
  const rest = restReversed.reverse()
  return `${rest.join(', ')} and ${last}`
}

const buildReasons = (taskState, includeForce) => {
  const reasons = []
  if (taskState.missingInputs.length > 0) {
    reasons.push(`missing inputs (${taskState.missingInputs.join(', ')})`)
  }
  if (taskState.missingOutputs.length > 0) {
    reasons.push(`missing outputs (${taskState.missingOutputs.join(', ')})`)
  }
  if (taskState.hasStaleOutputs) {
    reasons.push('stale outputs')
  }
  if (includeForce) {
    reasons.push('force enabled')
  }
  return reasons
}

const formatDuration = (milliseconds) => {
  if (!Number.isFinite(milliseconds)) {
    return 'unknown duration'
  }
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`
  }
  return `${(milliseconds / 1000).toFixed(1)}s`
}

const safeCommandPart = (part) =>
  /^[A-Za-z0-9@%_=+:,.\/\-]+$/.test(part) ? part : JSON.stringify(part)

const formatCommand = (parts) => parts.map(safeCommandPart).join(' ')

const runStep = (command, args) => {
  if (options.verbose) {
    console.log(`    ↳ ${command} ${args.join(' ')}`)
  }
  const result = spawnSync(command, args, { stdio: options.verbose ? 'inherit' : 'pipe', cwd: root })
  if (!options.verbose && result.stdout) {
    process.stdout.write(result.stdout)
  }
  if (!options.verbose && result.stderr) {
    process.stderr.write(result.stderr)
  }
  return result.status ?? 1
}

const results = []
let encounteredFailure = false

for (const task of selectedTasks) {
  const ensureSteps = task.ensureSteps ?? []
  const deployConfig = task.deploy ?? {}
  const deployDescription = deployConfig.description ?? `Deploy ${task.description}`
  const deploySteps = toArray(deployConfig.steps)

  const stateBefore = computeTaskState(task)
  const stateHasIssues = hasIssues(stateBefore)
  const reasons = buildReasons(stateBefore, options.force)

  if (options.plan) {
    const ensureRunnable = ensureSteps.length > 0
    const needsEnsure = options.force || stateHasIssues
    const describeEnsure = (needsEnsure || options.deploy) && ensureRunnable
    const describeDeploy = options.deploy && deploySteps.length > 0

    if (describeEnsure || describeDeploy || needsEnsure) {
      const reasonText = describeEnsure ? formatParts(reasons) : needsEnsure ? formatParts(reasons) : ''
      console.log(`\n🛠️  ${task.description}${reasonText ? ` (${reasonText})` : ''}`)
      if (describeEnsure) {
        console.log('    Prepare artifacts with:')
        for (const step of ensureSteps) {
          console.log(`      ${formatCommand(step)}`)
        }
      } else if (needsEnsure && !ensureRunnable) {
        console.log('    ⚠️  No automated preparation steps are defined for this task')
      } else {
        console.log('    Artifacts are up to date')
      }
      if (describeDeploy) {
        console.log(`    Deploy via ${deployDescription}:`)
        for (const step of deploySteps) {
          console.log(`      ${formatCommand(step)}`)
        }
      } else if (options.deploy && deploySteps.length === 0) {
        console.log(`    ℹ️  ${deployDescription} has no deployment steps defined`)
      }
    } else {
      console.log(`✅ ${task.description} is up to date`)
    }
    if (stateHasIssues) {
      encounteredFailure = true
    }
    const planEntries = []
    if (describeEnsure) {
      planEntries.push(
        ...ensureSteps.map((step) => ({
          phase: 'ensure',
          command: step[0],
          args: step.slice(1),
          formatted: formatCommand(step),
        })),
      )
    }
    if (describeDeploy) {
      planEntries.push(
        ...deploySteps.map((step) => ({
          phase: 'deploy',
          description: deployDescription,
          command: step[0],
          args: step.slice(1),
          formatted: formatCommand(step),
        })),
      )
    }
    results.push({
      id: task.id,
      description: task.description,
      status: stateHasIssues ? 'needs-update' : 'ready',
      ranSteps: false,
      reasons,
      state: stateBefore,
      plan: planEntries,
      deploy: {
        requested: options.deploy,
        hasSteps: deploySteps.length > 0,
        description: deployDescription,
      },
    })
    continue
  }

  if (options.check) {
    if (stateHasIssues) {
      encounteredFailure = true
      console.log(`❌ ${task.description} requires updates (${formatParts(reasons)})`)
    } else {
      console.log(`✅ ${task.description} is up to date`)
    }
    results.push({
      id: task.id,
      description: task.description,
      status: stateHasIssues ? 'needs-update' : 'ready',
      ranSteps: false,
      reasons,
      state: stateBefore,
      deploy: {
        requested: options.deploy,
        hasSteps: deploySteps.length > 0,
        description: deployDescription,
      },
    })
    continue
  }

  let ranEnsureSteps = false
  let ensureDuration
  let stateAfter = stateBefore

  if (!options.force && !stateHasIssues) {
    console.log(`✅ ${task.description} is up to date`)
  } else {
    if (ensureSteps.length === 0) {
      encounteredFailure = true
      console.error(`❌ ${task.description} has no steps to resolve missing or stale artifacts`)
      process.exit(1)
    }

    const reasonText = formatParts(reasons)
    console.log(`\n⏳ ${task.description}${reasonText ? ` (${reasonText})` : ''}`)

    const startTime = performance.now()

    for (const [command, ...args] of ensureSteps) {
      const status = runStep(command, args)
      if (status !== 0) {
        encounteredFailure = true
        console.error(`❌ ${task.description} failed while running ${command}`)
        process.exit(status)
      }
    }

    ensureDuration = performance.now() - startTime
    stateAfter = computeTaskState(task)

    if (hasIssues(stateAfter)) {
      encounteredFailure = true
      const afterReasons = buildReasons(stateAfter, false)
      console.error(
        `❌ Generated artifacts appear incomplete for ${task.description}: ${formatParts(afterReasons)}`,
      )
      process.exit(1)
    }

    console.log(`✅ ${task.description} complete in ${formatDuration(ensureDuration)}`)
    ranEnsureSteps = true
  }

  let ranDeploySteps = false
  let deployDuration

  if (options.deploy) {
    if (deploySteps.length === 0) {
      console.log(`ℹ️  ${deployDescription} has no deployment steps defined; skipping`)
    } else {
      console.log(`\n🚀 ${deployDescription}`)
      const deployStart = performance.now()
      for (const [command, ...args] of deploySteps) {
        const status = runStep(command, args)
        if (status !== 0) {
          encounteredFailure = true
          console.error(`❌ ${deployDescription} failed while running ${command}`)
          process.exit(status)
        }
      }
      deployDuration = performance.now() - deployStart
      console.log(`✅ ${deployDescription} complete in ${formatDuration(deployDuration)}`)
      ranDeploySteps = true
    }
  }

  results.push({
    id: task.id,
    description: task.description,
    status: ranEnsureSteps ? 'updated' : 'up-to-date',
    ranSteps: ranEnsureSteps,
    durationMs: ensureDuration,
    reasons: ranEnsureSteps ? reasons : [],
    state: stateAfter,
    deploy: {
      requested: options.deploy,
      ran: ranDeploySteps,
      description: deployDescription,
      durationMs: deployDuration,
      hasSteps: deploySteps.length > 0,
    },
  })
}

let exitCode = 0

if (options.plan) {
  if (encounteredFailure) {
    console.error('\n❌ Some artifacts require manual preparation (see commands above)')
    exitCode = 1
  } else {
    console.log('\n✅ All artifacts are up to date; no manual preparation required')
  }
} else if (options.check) {
  if (encounteredFailure) {
    console.error('\n❌ Some artifacts are missing or stale')
    exitCode = 1
  } else {
    console.log('\n✅ Test artifacts verified')
  }
} else {
  console.log('\n✅ Test artifacts are ready')
}

if (options.json) {
  const summary = {
    ok: !encounteredFailure,
    mode: options.plan ? 'plan' : options.check ? 'check' : 'ensure',
    results,
  }
  console.log(JSON.stringify(summary, null, 2))
}

if (exitCode !== 0) {
  process.exit(exitCode)
}
