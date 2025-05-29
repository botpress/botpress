#!/usr/bin/env tsx
import chalk from 'chalk'
import { spawn } from 'child_process'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

const EXAMPLES_DIR = path.resolve('.')

const args = process.argv.slice(2)
const exampleName = args[0]

// Optional: declare required envs per example
const required = ['BOTPRESS_BOT_ID', 'BOTPRESS_TOKEN']

function listExamples() {
  const folders = fs.readdirSync(EXAMPLES_DIR).filter((f) => {
    const fullPath = path.join(EXAMPLES_DIR, f)
    return (f.includes('_chat') || f.includes('_worker')) && fs.statSync(fullPath).isDirectory()
  })

  console.log(chalk.yellow('📦 Available examples:\n'))
  folders.forEach((f) => {
    console.log(`  ${chalk.green(f)}`)
  })
  console.log(`\n${chalk.cyan('Usage:')} pnpm start ${chalk.underline('<example_name>')}`)
  process.exit(1)
}

if (!exampleName) {
  console.log(chalk.red('❌ No example specified.\n'))
  listExamples()
}

const entryPath = path.join(EXAMPLES_DIR, exampleName, 'index.ts')
if (!fs.existsSync(entryPath)) {
  console.log(chalk.red(`❌ Example "${exampleName}" not found.\n`))
  listExamples()
}

// Load .env if present
dotenv.config({ path: path.join(EXAMPLES_DIR, exampleName, '.env') })

const missing = required.filter((key) => !process.env[key])

if (missing.length) {
  console.log(chalk.red('❌ Missing required environment variables:\n'))
  missing.forEach((key) => console.log(`  - ${chalk.yellow(key)}`))
  console.log(`\nSet them in ${chalk.cyan(`examples/${exampleName}/.env`)}`)
  process.exit(1)
}

console.log(chalk.greenBright(`🚀 Launching example: ${chalk.bold(exampleName)}\n`))

// Run the example via tsx
const child = spawn('tsx', [entryPath], {
  stdio: 'inherit',
  env: process.env,
})
child.on('exit', (code) => {
  process.exit(code ?? 1)
})
