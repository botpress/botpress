const fs = require('fs')

const v = fs.readFileSync('./versions.txt', 'utf8').toString()

console.log(
  JSON.stringify(
    v
      .split(/\n/)
      .map(v => v.trim())
      .filter(v => v.length && !['docs'].includes(v))
  )
)
