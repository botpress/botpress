import moment from 'moment'
import util from '../src/util'

const expect = require('chai').expect

describe('Util', () => {
  describe('Get human expression', () => {
    it('works cron', () => {
      const res = util.getHumanExpression('cron', '*/5 * * * *')
      expect(res).to.be.a('string')
      expect(res).to.equal('Every 5 minutes')
    })

    it('works once future', () => {
      const futureDate = moment().add(5, 'hours')
      const res = util.getHumanExpression('once', futureDate.toDate())
      expect(res).to.be.a('string')
      expect(res).to.equal('Once, in 5 hours')
    })
  })

  describe('Get next occurence', () => {
    it('throws cron', () => {
      const fn = () => util.getNextOccurence('cron')
      expect(fn).to.throw()
    })

    it('works cron', () => {
      const res = util.getNextOccurence('cron', '* * * * *')
      expect(res).to.be.an('object')
      expect(res.toDate()).to.be.a('date')
      expect(res.fromNow()).to.contain('in ')
    })

    it('works natural', () => {
      const res = util.getNextOccurence('natural', 'every 7 minutes')
      expect(res).to.be.an('object')
      expect(res.toDate()).to.be.a('date')
      expect(res.fromNow()).to.contain('in ')
    })
  })
})
