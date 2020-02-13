const exec = require('child_process').exec

const watch = cb => {
  const shared = exec('yarn && yarn start', { cwd: 'src/bp/react-botpress-components' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

module.exports = {
  watch
}
