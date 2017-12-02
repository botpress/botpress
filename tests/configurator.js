/* eslint-env babel-eslint, node, mocha */

const expect = require('chai').expect
const { createConfig } = require('../src/configurator.js')
const Promise = require('bluebird')
const _ = require('lodash')

describe('configurator', () => {
  let getCalled = false
  let setCalled = false

  const kvs = {
    get: () => {
      getCalled = true
      return Promise.resolve(true)
    },
    set: () => {
      setCalled = true
      return Promise.resolve(true)
    }
  }

  const getValidCreateArgs = () => ({
    kvs: kvs,
    name: 'valid-name',
    options: {
      key1: { type: 'string' },
      key2: { type: 'choice', validation: ['A', 'B'], default: 'A' },
      key3: { type: 'bool', default: true }
    }
  })

  beforeEach(() => {
    getCalled = setCalled = false
  })

  describe('createConfig', () => {
    it('throws if invalid name', () => {
      const fns = [
        () => createConfig({ kvs, name: '' }),
        () => createConfig({ kvs, name: null }),
        () => createConfig({ kvs, name: 'botpress-#$' })
      ]

      _.each(fns, fn => expect(fn).to.throw(/invalid configuration name/i))
    })

    it('throws if option missing type', () => {
      const args = getValidCreateArgs()
      delete args.options.key1.type
      const fn = () => createConfig(args)

      expect(fn).to.throw(/key1/i)
    })

    it('throws if option invalid type', () => {
      const args = getValidCreateArgs()
      args.options.key1.type = 'rocket'
      const fn = () => createConfig(args)

      expect(fn).to.throw(/key1/i)
    })

    it('validation is defaulted to true', () => {
      const args = getValidCreateArgs()
      const config = createConfig(args)

      expect(config.options.key1.validation()).to.equal(true)
    })

    it('validation is not overriden when already set', () => {
      const args = getValidCreateArgs()
      args.options.key1.validation = () => false
      const config = createConfig(args)

      expect(config.options.key1.validation()).to.equal(false)
    })

    it('throws invalid default values', () => {
      const createWith = key1 => {
        const valid = getValidCreateArgs()
        delete valid.options.key1
        valid.options.key1 = key1
        return valid
      }

      const fns = [
        () => createConfig(createWith({ type: 'string', default: false })),
        () => createConfig(createWith({ type: 'string', default: null })),
        () => createConfig(createWith({ type: 'string', default: 'hello', validation: () => false })),
        () => createConfig(createWith({ type: 'bool', default: '' })),
        () => createConfig(createWith({ type: 'choice', default: null })),
        () => createConfig(createWith({ type: 'choice', validation: ['A', 'B'], default: 'C' }))
      ]

      _.each(fns, fn => expect(fn).to.throw(/invalid default value/i))
    })

    it('returns amended options', () => {
      const args = getValidCreateArgs()
      const config = createConfig(args)

      expect(config.options.key1.validation).to.not.be.undefined
      expect(config.options.key1.required).to.not.be.undefined
      expect(config.options.key1.env).to.not.be.undefined
      expect(config.options.key1.default).to.not.be.undefined
    })
  })

  describe('validateSave', () => {
    it('dont throw if missing mandatory key', () => {
      const args = getValidCreateArgs()
      const config = createConfig(args)
      const fn = () => config.saveAll({ key2: 'B' })
      expect(fn).to.not.throw()
    })

    it('throws if missing required key', () => {
      const args = getValidCreateArgs()
      args.options.key1.required = true

      const config = createConfig(args)
      const fn = () => config.saveAll({ key2: 'B' })
      expect(fn).to.throw(/key1/i)
    })

    it('throws if invalid value', () => {
      const args = getValidCreateArgs()
      const config = createConfig(args)
      const fn = () => config.saveAll({ key2: 'C' })
      expect(fn).to.throw(/key2/i)
    })
  })
})
