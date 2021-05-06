const gulp = require('gulp')
const exec = require('child_process').exec

const buildNLUInstaller = cb => {
  const buildProcess = exec(`yarn && yarn build`, { cwd: 'build/nlu-installer' }, err => {
    if (err) {
      return cb(err)
    }
    cb()
  })
  buildProcess.stdout.pipe(process.stdout)
  buildProcess.stderr.pipe(process.stderr)
}

const makeDownloadTask = args => {
  const downloadNLU = cb => {
    const downloadProcess = exec(`yarn start ${args.join(' ')}`, { cwd: 'build/nlu-installer' }, err => {
      if (err) {
        return cb(err)
      }
      cb()
    })
    downloadProcess.stdout.pipe(process.stdout)
    downloadProcess.stderr.pipe(process.stderr)
  }
  return downloadNLU
}

const installNLU = args => {
  const downloadNLU = makeDownloadTask(args)
  return gulp.series([buildNLUInstaller, downloadNLU])
}

module.exports = {
  installNLU
}
