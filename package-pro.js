const fs = require('fs')
const proPackage = require('./package-pro.json')
const litePackage = require('./package.json')

const combinedPackage = Object.assign({}, litePackage, {
  dependencies: Object.assign({}, litePackage.dependencies, proPackage.dependencies),
  devDependencies: Object.assign({}, litePackage.devDependencies, proPackage.devDependencies)
})

fs.writeFileSync('./package.json', JSON.stringify(combinedPackage))
fs.unlinkSync('./yarn.lock')
fs.writeFileSync('./.pro-mode', '')

console.log('Your package.json has been updated with packages required for pro-edition.')
console.log("Make sure to install dependencies! Please, don't push these changes to the repo!")
