/* eslint-env babel-eslint, node, mocha */

import _ from 'lodash'
import Promise from 'bluebird'
import Conversations from '../src/conversations'

const expect = require('chai').expect

let conversations = null

const user = n => ({ id: n })

const eventFrom = (user, txt = 'Default text') => ({
  platform: 'facebook',
  type: 'text',
  user: user,
  text: txt,
  raw: { message: txt }
})

const response = text => ({
  text: text,
  raw: null,
  type: 'text',
  platform: 'facebook'
})

describe('conversations', function() {
  let incoming = null
  let outgoing = null

  let middleware = {
    register: function({ handler }) {
      incoming = handler
    },

    sendOutgoing: function(event) {
      outgoing && outgoing(event)
    }
  }

  beforeEach(function() {
    conversations = Conversations({ middleware: middleware, clockSpeed: 5 })
  })

  afterEach(function() {
    conversations.destroy()
  })

  describe('start', function() {

    it('returns a conversation', function() {
      const convo = conversations.start(eventFrom(user(1)))
      expect(convo).not.to.be.null
      expect(convo).property('createThread').not.to.be.null
      expect(convo).property('switchTo').not.to.be.null
      expect(convo).property('next').not.to.be.null
      expect(convo).property('processIncoming').not.to.be.null
      expect(convo).property('say').not.to.be.null
      expect(convo).property('setTimeout').not.to.be.null
      expect(convo).property('get').not.to.be.null
      expect(convo).property('set').not.to.be.null
      expect(convo).property('activate').not.to.be.null
      expect(convo).property('on').not.to.be.null
    })

    it('expects an event to create a conversation', function() {
      const fn = () => conversations.start()
      expect(fn).to.throw(/event/i)
    })

    it('activated by default', function() {
      const convo = conversations.start(eventFrom(user(1)))
      expect(convo).property('status').to.equal('active')
    })

  })

  describe('create', function() {
    it('not activated', function() {
      const convo = conversations.create(eventFrom(user(1)))
      expect(convo).property('status').to.equal('new')
    })

    it('activate', function() {
      const convo = conversations.create(eventFrom(user(1)))

      convo.activate()

      expect(convo).property('status').to.equal('active')
    })
  })

  describe('incoming processing', function() {

    it('does not process if conversation new', function(done) {
      const convo = conversations.create(eventFrom(user(1)))

      convo.on('beforeProcessing', () => done('processing called'))
      incoming(eventFrom(user(1)))

      setTimeout(done, 5)
    })

    it('process when conversation active', function(done) {
      this.timeout(50)

      const convo = conversations.start(eventFrom(user(1)))
      convo.on('beforeProcessing', () => done())
      incoming(eventFrom(user(1)))
    })

    it('does not process if different plaform', function(done) {
      const convo = conversations.start(eventFrom(user(1)))

      const newEvent = eventFrom(user(1))
      newEvent.platform = 'random'

      convo.on('beforeProcessing', () => done('processing called'))
      incoming(newEvent)

      setTimeout(done, 5)
    })

    it('does not process if different users', function(done) {
      const convo = conversations.start(eventFrom(user(1)))

      const newEvent = eventFrom(user(2))

      convo.on('beforeProcessing', () => done('processing called'))
      incoming(newEvent)

      setTimeout(done, 5)
    })

  })

  describe('Flow - Default thread', function() {

    it('addMessage is not sent if not started', function(done) {
      const convo = conversations.create(eventFrom(user(1)))

      outgoing = event => done('Should not have been called')

      convo.defaultThread.addMessage(response('Hello'))

      setTimeout(done, 10)
    })

    it('On addMessage is sent', function(done) {
      const convo = conversations.start(eventFrom(user(1)))

      outgoing = event => {
        expect(event).property('text').to.equal('Hello')
        done()
      }

      convo.defaultThread.addMessage(response('Hello'))
    })

    it('On addQuestion is sent', function(done) {
      const convo = conversations.start(eventFrom(user(1)))

      outgoing = event => {
        expect(event).property('text').to.equal('Hello')
        done()
      }

      convo.defaultThread.addQuestion(response('Hello'), [])
    })

    it('Multiple messages are sent in a row and in order', function(done) {
      const convo = conversations.start(eventFrom(user(1)))

      let count = 0

      outgoing = event => {
        expect(parseInt(event.text)).to.equal(count++)
        if (count == 4) {
          done()
        }
      }

      convo.defaultThread.addMessage(response('0'))
      convo.defaultThread.addMessage(response('1'))
      convo.defaultThread.addMessage(response('2'))
      convo.defaultThread.addMessage(response('3'))
    })

    it('Questions wait for answer', function(done) {
      const convo = conversations.start(eventFrom(user(1)))

      outgoing = event => {
        if (event.text === '0') {
          setTimeout(done, 10)
        }

        if (event.text === '1') {
          return done('Should not have been sent')
        }
      }

      convo.defaultThread.addQuestion(response('0'), [])
      convo.defaultThread.addMessage(response('1'))
    })

  })

  describe('Flow - Ask question', function() {

    it('Correct handler gets called', function(done) {
      const convo = conversations.start(eventFrom(user(1)))

      outgoing = () => {}

      convo.defaultThread.addQuestion(response('Hello'), [
        { pattern: 'no', callback: () => done('Nope') },
        { pattern: 'yes', callback: () => done() }
      ])

      setTimeout(() => {
        incoming(eventFrom(user(1), 'yes'))
      }, 5)
    })

    it('Only one gets called (first declared)', function(done) {
      const convo = conversations.start(eventFrom(user(1)))

      outgoing = () => {}

      convo.defaultThread.addQuestion(response('Hello'), [
        { pattern: 'no', callback: () => done('Nope') },
        { pattern: /.+/i, callback: () => done() },
        { pattern: 'yes', callback: () => done('Nope') }
      ])

      setTimeout(() => {
        incoming(eventFrom(user(1), 'yes'))
      }, 5)
    })

    it('Convo.next', function(done) {
      const convo = conversations.start(eventFrom(user(1)))

      outgoing = event => event.text === 'done' && done()

      convo.defaultThread.addQuestion(response('Hello'), [
        { pattern: 'no', callback: () => done('Nope') },
        { pattern: 'yes', callback: () => {
          convo.next()
        } }
      ])

      convo.defaultThread.addMessage(response('done'))

      setTimeout(() => {
        incoming(eventFrom(user(1), 'yes'))
      }, 5)
    })

  })

  describe('Thread switching', function() {

    it('Correct handler gets called', function(done) {
      const convo = conversations.create(eventFrom(user(1)))      
      const thread = convo.createThread('hello')

      let handler = () => done('Not yet')

      thread.addQuestion(response('Anything'), [
        { pattern: 'yes', callback: () => handler() }
      ])

      convo.activate()

      handler = () => done()
      convo.switchTo('hello')

      setTimeout(() => {
        incoming(eventFrom(user(1), 'yes'))
      }, 5)
      
    })

    it('Other thread doesnt get call if no switch', function(done) {
      conversations.start(eventFrom(user(1)), convo => {

        const thread = convo.createThread('hello')

        let handler = () => done('Not yet')

        thread.addQuestion(response('Anything'), [
          { pattern: 'yes', callback: () => handler() }
        ])

        setTimeout(() => {
          incoming(eventFrom(user(1), 'yes'))
        }, 5)

        setTimeout(done, 15)
      })
    })

  })

  it('convo.say() supports simple string', function(done) {
    const convo = conversations.start(eventFrom(user(1)))

    outgoing = event => {
      expect(event).property('text').to.equal('Hello')
      done()
    }

    convo.say('Hello')
  })

})
