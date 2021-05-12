const gulp = require('gulp')
const { spawn } = require('child_process')

const wrapWithPromise = spawnCmd => {
  return new Promise(async (resolve, reject) => {
    try {
      const spawnedPocess = spawnCmd()
      spawnedPocess.on('exit', (code, signal) => {
        if (code !== 0) {
          console.error(`Process exited with exit-code ${code} and signal ${signal}`)
          reject()
        }
        resolve()
      })
    } catch (err) {
      reject(err)
    }
  })
}

const buildNLUInstaller = async cb => {
  try {
    await wrapWithPromise(() => spawn('yarn', [], { cwd: './build/nlu-installer', stdio: 'inherit', shell: true }))
    await wrapWithPromise(() =>
      spawn('yarn', ['build'], { cwd: './build/nlu-installer', stdio: 'inherit', shell: true })
    )
    cb()
  } catch (err) {
    cb(err)
  }
}

const makeDownloadTask = args => async cb => {
  try {
    await wrapWithPromise(() =>
      spawn('yarn', ['start', ...args], { cwd: './build/nlu-installer', stdio: 'inherit', shell: true })
    )
    cb()
  } catch (err) {
    cb(err)
  }
}

const installNLU = args => {
  const downloadNLU = makeDownloadTask(args)
  return gulp.series([buildNLUInstaller, downloadNLU])
}

module.exports = {
  installNLU
}
