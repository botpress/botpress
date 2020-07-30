const files = process.argv
  .slice(2)
  .filter(file => /\.tsx?$/.test(file))
  .join(' ')

console.log('::set-output name=files::' + files)
