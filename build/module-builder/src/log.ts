import chalk from 'chalk'

let level = false

export function configure(verboseLevel) {
  level = verboseLevel
}

export function log(color, message) {
  console.log(chalk[color]('[module-builder] ' + message))
}

export function debug(message) {
  if (!level) {
    return
  }
  log('cyan', message)
}

export function error(message) {
  log('red', message)
}

export function normal(message) {
  log('grey', message)
}
