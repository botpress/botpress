const fs = require('fs')

const lines = fs
  .readFileSync('CHANGELOG.md')
  .toString()
  .split('\n')

const finalLines = []

for (let i = 0; i < lines.length; i++) {
  const currentLine = lines[i].split('([')[0]
  const nextLine = i + 1 < lines.length && lines[i + 1].split('([')[0]

  // ignore the first dupe commit (merge) & keeps all new lines
  if (currentLine !== nextLine || currentLine === '') {
    finalLines.push(lines[i])
  }
}

fs.writeFileSync('CHANGELOG.md', finalLines.join('\n'), 'UTF-8')
