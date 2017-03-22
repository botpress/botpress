/* eslint-env babel-eslint, node, mocha */

import fs from 'fs'
import path from 'path'
const expect = require('chai').expect

import { requireExtension } from '../src/extensions'

//TODO: Require works for edition (Ultimate C, Pro A, Lite A)
//TODO: Require works for downgrade (Ultimate -> Pro) A
//TODO: Require works for downgrade (Ultimate -> Lite) B
//TODO: Require works for downgrade (Pro -> Lite) B
//TODO: Throws correctly (D)

describe('Extensions Loader', () => {
  const tmpFiles = []
  const writeFile = (path, content) => {
    tmpFiles.push(path)
    fs.writeFileSync(path, content)
  }

  before(function() {
    const extensionPath = (edition, file) => path.resolve(__dirname, '../extensions', edition, file)
    const fileContent = edition => 'module.exports = () => ' + edition

    writeFile(extensionPath('lite', 'b.js'), fileContent('lite'))
    writeFile(extensionPath('pro', 'a.js'), fileContent('pro'))
    writeFile(extensionPath('ultimate', 'c.js'), fileContent('ultimate'))
  })

  after(function() {
    tmpFiles.forEach(f => fs.unlinkSync(f))
  })

  it('Require works for edition', function() {

    process.env.BOTPRESS_EDITION = 'ultimate'
    expect(requireExtension('c.js')).to.equal('ultimate')

    process.env.BOTPRESS_EDITION = 'pro'
    expect(requireExtension('a.js')).to.equal('pro')

    process.env.BOTPRESS_EDITION = 'lite'
    expect(requireExtension('a.js')).to.equal('lite')
  })

})