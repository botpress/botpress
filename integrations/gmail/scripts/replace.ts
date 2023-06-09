import fs from 'fs'

const indexFile = './.botpress/dist/index.js'

function replaceAll(value: string, search: string, replace: string) {
  return value.split(search).join(replace)
}

const environment = process.env.ENVIRONMENT ?? 'production'

const replaceStrings = {
  production: "'production'",
  local: "'local'",
  staging: "'staging'",
} as const

const replaceValue = replaceStrings[environment]

if (!replaceValue) {
  throw new Error(`Invalid environment: ${environment}`)
}

const content = fs.readFileSync(indexFile, 'utf8')
const newContent = replaceAll(content, 'process.env.ENVIRONMENT', replaceValue)

fs.writeFileSync(indexFile, newContent)
