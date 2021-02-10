import chalk from 'chalk'

let level = false

export function configure(verboseLevel) {
  level = verboseLevel
}

export function log(color: string, message: string, source?: string) {
  // eslint-disable-next-line no-console
  console.log(chalk[color](`[${source || 'module-builder'}] ` + message))
}

export function debug(message: string, source?: string) {
  if (!level) {
    return
  }
  log('cyan', message, source)
}

export function error(message: string, source?: string) {
  log('red', message, source)
}

export function normal(message: string, source?: string) {
  log('grey', message, source)
}
