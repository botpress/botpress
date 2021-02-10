const exec = require('child_process').exec

const lintSrc = cb => {
  const admin = exec(`yarn run eslint src/bp --ext .ts,.tsx`, err => cb(err))
  admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const lintAdmin = cb => {
  const admin = exec(`yarn run eslint src/bp/ui-admin --ext .ts,.tsx`, err => cb(err))
  admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const lintStudio = cb => {
  const admin = exec(`yarn run eslint src/bp/ui-admin --ext .ts,.tsx`, err => cb(err))
  admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

const lintModules = cb => {
  //yarn run eslint --resolve-plugins-relative-to . src/bp/ui-admin/src --ext .ts,.tsx
  const admin = exec(`yarn run eslint modules --ext .ts,.tsx`, err => cb(err))
  admin.stdout.pipe(process.stdout)
  admin.stderr.pipe(process.stderr)
}

module.exports = {
  lintAdmin,
  lintStudio,
  lintModules,
  lintSrc
}
