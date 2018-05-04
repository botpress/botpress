/* eslint-env babel-eslint, node, mocha */

import { expect } from 'chai'
import { isBotpressPackage } from '../src/util'
import { getModuleShortname } from '../src/util'

describe('Botpress modules detection', () => {
  let logger, queue

  describe('isBotpressPackage', function() {
    it('detects @botpress/foo', function() {
      const result = isBotpressPackage('@botpress/foo')
      expect(result).to.equal(true)
    })

    it('detects botpress-foo', function() {
      const result = isBotpressPackage('botpress-foo')
      expect(result).to.equal(true)
    })

    it('detects @myorg/botpress-foo', function() {
      const result = isBotpressPackage('@myorg/botpress-foo')
      expect(result).to.equal(true)
    })

    it('rejects @myorg/foo', function() {
      const result = isBotpressPackage('@myorg/foo')
      expect(result).to.equal(false)
    })
  })

  describe('getModuleShortname', function() {
    it('@botpress/foo -> foo', function() {
      const shortName = getModuleShortname('@botpress/foo')
      expect(shortName).to.equal('foo')
    })

    it('botpress-foo -> foo', function() {
      const shortName = getModuleShortname('botpress-foo')
      expect(shortName).to.equal('foo')
    })

    it('@myorg/botpress-foo -> foo', function() {
      const shortName = getModuleShortname('@myorg/botpress-foo')
      expect(shortName).to.equal('foo')
    })
  })
})
