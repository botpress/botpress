const micromatch = require('micromatch')

module.exports = {
  '*.ts': files => {
    const match = micromatch.not(files, '*styl.d.ts')
    return `eslint ${match.join(' ')}`
  }
}
