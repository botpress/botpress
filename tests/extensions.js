/* eslint-env babel-eslint, node, mocha */

import fs from 'fs'
import path from 'path'
const expect = require('chai').expect

import { requireExtension } from '../extensions/extensions'

describe('Extensions Loader', () => {
  const tmpFiles = []
  const tmpDirs = []
  const writeFile = (path, content) => {
    tmpFiles.push(path)
    fs.writeFileSync(path, content)
  }
  const writeDir = path => {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path)
      tmpDirs.unshift(path)
    }
  }

  const makeRequest = file => path.resolve(__dirname, '../extensions/lite', file)

  before(function() {

    const extensionPath = (edition, file) => path.resolve(__dirname, '../extensions', edition, file || '')
    const fileContent = edition => `module.exports = () => '${edition}'`

    writeDir(extensionPath('lite'))
    writeDir(extensionPath('enterprise'))
    writeDir(extensionPath('enterprise/pro'))
    writeDir(extensionPath('enterprise/ultimate'))
      
    writeFile(extensionPath('lite', 'b.js'), fileContent('lite'))
    writeFile(extensionPath('enterprise/pro', 'a.js'), fileContent('pro'))
    writeFile(extensionPath('enterprise/ultimate', 'c.js'), fileContent('ultimate'))
    
  })

  after(function() {
    tmpFiles.forEach(f => fs.unlinkSync(f))
    tmpDirs.forEach(f => fs.rmdirSync(f))
  })

  it('Require works for edition', function() {

    process.env.BOTPRESS_EDITION = 'ultimate'
    expect(requireExtension(makeRequest('c.js'))).to.contain('ultimate')

    process.env.BOTPRESS_EDITION = 'pro'
    expect(requireExtension(makeRequest('a.js'))).to.contain('pro')

    process.env.BOTPRESS_EDITION = 'lite'
    expect(requireExtension(makeRequest('b.js'))).to.contain('lite')
  })

  it('Require works for downgrade (Ultimate -> Pro)', function() {
    process.env.BOTPRESS_EDITION = 'ultimate'
    expect(requireExtension(makeRequest('a.js'))).to.contain('pro')
  })

  it('Require works for downgrade (Ultimate -> Lite)', function() {
    process.env.BOTPRESS_EDITION = 'ultimate'
    expect(requireExtension(makeRequest('b.js'))).to.contain('lite')
  })

  it('Require works for downgrade (Pro -> Lite)', function() {
    process.env.BOTPRESS_EDITION = 'pro'
    expect(requireExtension(makeRequest('b.js'))).to.contain('lite')
  })

  it('File require does not exist in lite', function() {
    process.env.BOTPRESS_EDITION = 'ultimate'
    expect(() => requireExtension(makeRequest('d.js'))).to.throw()
  })

})