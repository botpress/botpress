import { ZXCVBNPolicy, ZXCVBNPolicyOptions } from './zxcvbn-password-policy'

describe('ZXCVBN', () => {
  const zxcvbnPolicy = new ZXCVBNPolicy()

  // obviously cannot cover all use cases but these examples gives a good overview
  // for more details check dropbox/zxcvbn repo
  describe('minScore', () => {
    const policyOptions: ZXCVBNPolicyOptions = {
      failWhenCommonWordIsDominant: false
    }
    it('should not fail when minScore is not set', () => {
      expect(zxcvbnPolicy.assert(policyOptions, 'lol')).toBeTruthy()
    })

    it('should not fail when minScore is not set 0', () => {
      expect(zxcvbnPolicy.assert({ minScore: 0, ...policyOptions }, '1')).toBeTruthy()
      expect(zxcvbnPolicy.assert({ minScore: 0, ...policyOptions }, 'lol')).toBeTruthy()
    })

    it('should fail when minScore is set to 1 given a "VERY WEAK" candidate but not with something "WEAK" ', () => {
      expect(zxcvbnPolicy.assert({ minScore: 1, ...policyOptions }, 'lol')).toBeFalsy()
      expect(zxcvbnPolicy.assert({ minScore: 1, ...policyOptions }, 'Sh0uldBeF!ne')).toBeTruthy()
    })

    it('should fail when minScore is set to 2 given a "WEAK" candidate but not with something "OK" ', () => {
      expect(zxcvbnPolicy.assert({ minScore: 2, ...policyOptions }, 'lol')).toBeFalsy()
      expect(zxcvbnPolicy.assert({ minScore: 2, ...policyOptions }, 'Sh0uldBeF!ne')).toBeTruthy()
    })

    it('should fail when minScore is set to 3 given a "OK" candidate but not with something "GOOD" ', () => {
      expect(zxcvbnPolicy.assert({ minScore: 3, ...policyOptions }, 'N0tF!ne')).toBeFalsy()
      expect(zxcvbnPolicy.assert({ minScore: 3, ...policyOptions }, 'ShouldBeF!ne')).toBeTruthy()
    })

    it('should fail when minScore is set to 4 given a "GOOD" candidate but not with something "STRONG" ', () => {
      expect(zxcvbnPolicy.assert({ minScore: 4, ...policyOptions }, 'ShouldBeF!ne')).toBeFalsy()
      expect(zxcvbnPolicy.assert({ minScore: 4, ...policyOptions }, 'Th1sShouldBeF!ne')).toBeTruthy()
    })
  })

  describe('failWhenCommonWordIsDominant', () => {
    const policyOptions: ZXCVBNPolicyOptions = {
      failWhenCommonWordIsDominant: true
    }

    it('should pass when config is set to false', () => {
      expect(zxcvbnPolicy.assert({ failWhenCommonWordIsDominant: false }, 'beach')).toBeTruthy()
    })

    it('should pass when no common word found', () => {
      expect(zxcvbnPolicy.assert(policyOptions, '123')).toBeTruthy()
    })

    it('should fail when one common word that is dominant', () => {
      expect(zxcvbnPolicy.assert(policyOptions, 'beach123')).toBeFalsy() //beach is longer than !23
      expect(zxcvbnPolicy.assert(policyOptions, 'beacheveryday')).toBeFalsy() //everyday is longer than Beach
    })

    it('should pass when a common word is equal in length to the rest of the candidate', () => {
      expect(zxcvbnPolicy.assert(policyOptions, 'beacheveryday123')).toBeTruthy() // everyday is equal to beach123
    })

    it('should pass when no common word is dominant', () => {
      expect(zxcvbnPolicy.assert(policyOptions, 'beacheveryday1234')).toBeTruthy()
    })

    it('should pass when more than 2 common words', () => {
      expect(zxcvbnPolicy.assert(policyOptions, 'beachdayeveryday')).toBeTruthy()
    })

    it('should pass when candidate is very strong', () => {
      expect(zxcvbnPolicy.assert(policyOptions, 'BeachEveryDay!23')).toBeTruthy()
    })
  })
})
