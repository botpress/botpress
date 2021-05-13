import chalk from 'chalk'

const PREFIX = '[NLU Installer]'

export default {
  info: (log: string) => {
    // eslint-disable-next-line no-console
    console.log(chalk.green(PREFIX), log)
  },
  error: (log: string) => {
    // eslint-disable-next-line no-console
    console.log(chalk.red(PREFIX), log)
  }
}
