const fs = require('fs')

const changelog = fs.readFileSync('CHANGELOG.md').toString()

const whitelist = ['', '### Bug Fixes', '### Features']
const prevVersionMark = process.env.V.endsWith('0') ? `# [${process.env.V}]` : `## [${process.env.V}]`
const preVersionIdx = changelog.indexOf(prevVersionMark)

const newLines = changelog.slice(0, preVersionIdx).split('\n')
const prevContent = changelog.slice(preVersionIdx)

const finalLines = newLines
  .map(l => (whitelist.includes(l) || !prevContent.includes(l)) && l)
  .filter(l => typeof l === 'string')
  .join('\n')

fs.writeFileSync('CHANGELOG.md', `${finalLines}${prevContent}`, 'UTF-8')
