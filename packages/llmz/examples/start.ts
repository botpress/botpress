#!/usr/bin/env tsx
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import dotenv from 'dotenv'

export const examplesDirectory = path.dirname(fileURLToPath(import.meta.url))

export function listExamples(directory = examplesDirectory): string[] {
  return fs
    .readdirSync(directory)
    .filter((name) => /^\d+_(chat|worker)_/.test(name) && fs.existsSync(path.join(directory, name, 'index.ts')))
    .sort()
}

export function resolveExample(name: string, directory = examplesDirectory): string | undefined {
  return listExamples(directory).find((folder) => folder === name || folder.startsWith(`${name}_`))
}

export function loadEnvironment(folder: string, directory = examplesDirectory): void {
  // Shell values win, followed by example-specific settings and the shared .env.
  dotenv.config({ path: path.join(directory, folder, '.env') })
  dotenv.config({ path: path.join(directory, '.env') })
}

function main() {
  const name = process.argv[2]
  if (!name || name === '--list' || name === '--help') {
    console.log(
      `Examples:\n${listExamples()
        .map((folder) => `  ${folder}`)
        .join('\n')}`
    )
    console.log('\nUsage: pnpm start <example name or two-digit number>')
    return
  }

  const folder = resolveExample(name)
  if (!folder) throw new Error(`Unknown example: ${name}. Run pnpm start --list.`)
  loadEnvironment(folder)
  const missing = ['BOTPRESS_BOT_ID', 'BOTPRESS_TOKEN'].filter((key) => !process.env[key])
  if (missing.length) throw new Error(`Missing ${missing.join(', ')}. Configure examples/.env (see .env.example).`)

  console.log(`Launching ${folder}`)
  const child = spawn(process.execPath, ['--import', 'tsx', path.join(examplesDirectory, folder, 'index.ts')], {
    cwd: examplesDirectory,
    stdio: 'inherit',
    env: process.env,
  })
  child.on('error', (error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  child.on('exit', (code) => {
    process.exitCode = code ?? 1
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main()
