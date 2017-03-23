/* eslint-env babel-eslint, node, mocha */

import fs from 'fs'
import path from 'path'
const expect = require('chai').expect

import { requireExtension } from '../extensions/extensions'

describe('Extensions Loader', () => {
  const tmpFiles = []
  const writeFile = (path, content) => {
    tmpFiles.push(path)
    fs.writeFileSync(path, content)
  }

  before(function() {

    const extensionPath = (edition, file) => path.resolve(__dirname, '../extensions', edition, file)
    const fileContent = edition => `module.exports = () => '${edition}'`

    writeFile(extensionPath('lite', 'b.js'), fileContent('lite'))
    writeFile(extensionPath('pro', 'a.js'), fileContent('pro'))
    writeFile(extensionPath('ultimate', 'c.js'), fileContent('ultimate'))
    
  })

  after(function() {
    tmpFiles.forEach(f => fs.unlinkSync(f))
  })

  it('Require works for edition', function() {

    process.env.BOTPRESS_EDITION = 'ultimate'
    expect(requireExtension('c.js')).to.contain('ultimate')

    process.env.BOTPRESS_EDITION = 'pro'
    expect(requireExtension('a.js')).to.contain('pro')

    process.env.BOTPRESS_EDITION = 'lite'
    expect(requireExtension('b.js')).to.contain('lite')
  })

  it('Require works for downgrade (Ultimate -> Pro)', function() {
    process.env.BOTPRESS_EDITION = 'ultimate'
    expect(requireExtension('a.js')).to.contain('pro')
  })

  it('Require works for downgrade (Ultimate -> Lite)', function() {
    process.env.BOTPRESS_EDITION = 'ultimate'
    expect(requireExtension('b.js')).to.contain('lite')
  })

  it('Require works for downgrade (Pro -> Lite)', function() {
    process.env.BOTPRESS_EDITION = 'pro'
    expect(requireExtension('b.js')).to.contain('lite')
  })

  it('File require does not exist in lite', function() {
    process.env.BOTPRESS_EDITION = 'ultimate'
    expect(() => requireExtension('d.js')).to.throw()
  })

})