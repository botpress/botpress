// eslint-disable consistent-type-definitions
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getClient, getZai, metadata } from './utils'
import { TableAdapter } from '../src/adapters/botpress-table'

describe('zai.rate', () => {
  describe('string instructions', () => {
    it('should rate a single item with string instructions', async () => {
      const zai = getZai()
      // Unambiguous: complete student record with all fields filled
      const students = [
        {
          name: 'Alice Johnson',
          studentId: 'STU-001',
          email: 'alice@school.edu',
          phone: '+1-555-0100',
          address: '123 Main St, City, State 12345',
          enrollmentDate: '2024-01-15',
          gpa: 3.8,
          credits: 120,
        },
      ]
      const ratings = await zai.rate(students, 'how complete is this student record?')

      expect(ratings).toHaveLength(1)
      // Should be rated high (4-5 per criterion) since all fields are present
      expect(ratings[0]).toBeGreaterThanOrEqual(12) // 3 criteria * 4 minimum
      expect(ratings[0]).toBeLessThanOrEqual(25) // max possible with 5 criteria * 5
    })

    it('should rate multiple items with clear differences', async () => {
      const zai = getZai()
      const students = [
        // Complete record - should rate high
        {
          name: 'Alice Johnson',
          studentId: 'STU-001',
          email: 'alice@school.edu',
          phone: '+1-555-0100',
          address: '123 Main St',
          enrollmentDate: '2024-01-15',
        },
        // Minimal record - should rate low
        {
          name: 'Bob',
          studentId: null,
          email: null,
          phone: null,
          address: null,
          enrollmentDate: null,
        },
        // Partial record - should rate medium
        {
          name: 'Carol Smith',
          studentId: 'STU-003',
          email: 'carol@school.edu',
          phone: null,
          address: null,
          enrollmentDate: '2024-02-01',
        },
      ]
      const ratings = await zai.rate(students, 'how complete is this student record?')

      expect(ratings).toHaveLength(3)
      // Alice (complete) should be rated higher than Bob (minimal)
      expect(ratings[0]).toBeGreaterThan(ratings[1]!)
      // Carol (partial) should be between Alice and Bob
      expect(ratings[2]).toBeGreaterThan(ratings[1]!)
      expect(ratings[0]).toBeGreaterThan(ratings[2]!)
    })

    it('should provide detailed results with string instructions', async () => {
      const zai = getZai()
      const forms = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          address: '456 Oak Ave',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
        },
      ]
      const response = zai.rate(forms, 'how complete is this form submission?')
      const { output, usage, elapsed } = await response.result()

      expect(output).toHaveLength(1)
      expect(output[0]).toHaveProperty('total')
      expect(output[0]?.total).toBeGreaterThanOrEqual(3)
      expect(output[0]?.total).toBeLessThanOrEqual(25) // max 5 criteria * 5 rating

      // Should have multiple criteria (3-5)
      const criteriaKeys = Object.keys(output[0] ?? {}).filter((k) => k !== 'total')
      expect(criteriaKeys.length).toBeGreaterThanOrEqual(3)
      expect(criteriaKeys.length).toBeLessThanOrEqual(5)

      // Each criterion should be rated 1-5
      criteriaKeys.forEach((key) => {
        const score = output[0]?.[key]
        expect(score).toBeGreaterThanOrEqual(1)
        expect(score).toBeLessThanOrEqual(5)
        expect(Number.isInteger(score)).toBe(true)
      })

      expect(usage.tokens.total).toBeGreaterThan(0)
      expect(elapsed).toBeGreaterThan(0)
    })
  })

  describe('record instructions', () => {
    it('should rate items with fixed criteria', async () => {
      const zai = getZai()
      const passwords = [
        {
          password: 'Tr0ng!P@ssw0rd#2024',
          length: 20,
          hasUppercase: true,
          hasLowercase: true,
          hasNumbers: true,
          hasSymbols: true,
        },
        { password: 'weak', length: 4, hasUppercase: false, hasLowercase: true, hasNumbers: false, hasSymbols: false },
      ]
      const ratings = await zai.rate(passwords, {
        length: 'password length (12+ chars = very_good, 8-11 = good, 6-7 = average, 4-5 = bad, <4 = very_bad)',
        complexity:
          'character variety (uppercase+lowercase+numbers+symbols = very_good, 3 types = good, 2 types = average, 1 type = bad)',
        strength: 'overall password strength against brute force attacks',
      })

      expect(ratings).toHaveLength(2)

      // First password is strong
      expect(ratings[0]).toHaveProperty('length')
      expect(ratings[0]).toHaveProperty('complexity')
      expect(ratings[0]).toHaveProperty('strength')
      expect(ratings[0]).toHaveProperty('total')
      expect(ratings[0]?.length).toBeGreaterThanOrEqual(4) // 20 chars = very_good or good
      expect(ratings[0]?.complexity).toBeGreaterThanOrEqual(4) // all types = very_good or good
      expect(ratings[0]?.strength).toBeGreaterThanOrEqual(4)
      expect(ratings[0]?.total).toBe(
        (ratings[0]?.length ?? 0) + (ratings[0]?.complexity ?? 0) + (ratings[0]?.strength ?? 0)
      )

      // Second password is weak
      expect(ratings[1]?.length).toBeLessThanOrEqual(2) // 4 chars = bad or very_bad
      expect(ratings[1]?.complexity).toBeLessThanOrEqual(2) // only lowercase = bad or very_bad
      expect(ratings[1]?.strength).toBeLessThanOrEqual(2)
      expect(ratings[1]?.total).toBe(
        (ratings[1]?.length ?? 0) + (ratings[1]?.complexity ?? 0) + (ratings[1]?.strength ?? 0)
      )

      // Strong password should have higher total than weak
      expect(ratings[0]?.total).toBeGreaterThan(ratings[1]?.total ?? 0)
    })

    it('should rate with single criterion', async () => {
      const zai = getZai()
      const emails = [
        { email: 'valid.email@example.com', hasAt: true, hasDomain: true, hasTLD: true },
        { email: 'invalid-email', hasAt: false, hasDomain: false, hasTLD: false },
      ]
      const ratings = await zai.rate(emails, {
        validity: 'email format validity (has @ symbol, domain, and TLD)',
      })

      expect(ratings).toHaveLength(2)
      expect(ratings[0]).toHaveProperty('validity')
      expect(ratings[0]).toHaveProperty('total')
      // Valid email should rate high
      expect(ratings[0]?.validity).toBeGreaterThanOrEqual(4)
      expect(ratings[0]?.total).toBe(ratings[0]?.validity)

      // Invalid email should rate low
      expect(ratings[1]?.validity).toBeLessThanOrEqual(2)
      expect(ratings[1]?.total).toBe(ratings[1]?.validity)
    })

    it('should provide detailed results with record instructions', async () => {
      const zai = getZai()
      const files = [
        {
          filename: 'document.pdf',
          sizeBytes: 1024000,
          hasExtension: true,
          validName: true,
          reasonableSize: true,
        },
      ]
      const response = zai.rate(files, {
        naming: 'filename follows conventions (has extension, no special chars)',
        size: 'file size is reasonable (not too large or too small)',
      })
      const { output, usage, elapsed } = await response.result()

      expect(output).toHaveLength(1)
      expect(output[0]).toHaveProperty('naming')
      expect(output[0]).toHaveProperty('size')
      expect(output[0]).toHaveProperty('total')
      expect(output[0]?.total).toBe((output[0]?.naming ?? 0) + (output[0]?.size ?? 0))

      expect(usage.tokens.total).toBeGreaterThan(0)
      expect(elapsed).toBeGreaterThan(0)
    })
  })

  describe('large arrays', () => {
    it('should rate many items efficiently with parallelization', async () => {
      const zai = getZai()
      // Create 500 items to force chunking and parallel processing
      const items = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        // Every 10th item is complete, others are incomplete
        requiredField1: i % 10 === 0 ? 'present' : null,
        requiredField2: i % 10 === 0 ? 'present' : null,
        requiredField3: i % 10 === 0 ? 'present' : null,
        optionalField: i % 10 === 0 ? 'present' : null,
      }))

      const startTime = Date.now()
      const ratings = await zai.rate(items, 'how complete are the required fields?')
      const elapsed = Date.now() - startTime

      expect(ratings).toHaveLength(500)

      // Verify ratings are in correct order (matching input order)
      for (let i = 0; i < 500; i++) {
        expect(ratings[i]).toBeDefined()
        expect(typeof ratings[i]).toBe('number')

        if (i % 10 === 0) {
          // Complete items should rate high
          expect(ratings[i]).toBeGreaterThanOrEqual(12) // 3 criteria * 4
        } else {
          // Incomplete items should rate low
          expect(ratings[i]).toBeLessThanOrEqual(10) // Should be lower
        }
      }

      // With 500 items and max 50 per chunk, we should have ~10 chunks
      // Parallel processing should complete significantly faster than sequential
      // (this is a sanity check, not a strict performance test)
      console.log(`Rated 500 items in ${elapsed}ms`)
      expect(elapsed).toBeLessThan(300000) // Should complete within 5 minutes
    })

    it('should maintain order with large parallel chunks', async () => {
      const zai = getZai()
      // Create 300 items with predictable patterns
      const items = Array.from({ length: 300 }, (_, i) => ({
        id: i,
        value: i * 2,
        isEven: i % 2 === 0,
      }))

      const ratings = await zai.rate(items, {
        id_presence: 'does it have an id field?',
        value_presence: 'does it have a value field?',
      })

      expect(ratings).toHaveLength(300)

      // Verify order is maintained
      for (let i = 0; i < 300; i++) {
        expect(ratings[i]).toBeDefined()
        // All items have id and value, so all should rate high
        expect(ratings[i]?.id_presence).toBeGreaterThanOrEqual(4)
        expect(ratings[i]?.value_presence).toBeGreaterThanOrEqual(4)
        expect(ratings[i]?.total).toBe((ratings[i]?.id_presence ?? 0) + (ratings[i]?.value_presence ?? 0))
      }
    })

    it('should rate many items efficiently', async () => {
      const zai = getZai()
      // Create 100 items with objective completion scores
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        // Every 10th item is complete, others are incomplete
        requiredField1: i % 10 === 0 ? 'present' : null,
        requiredField2: i % 10 === 0 ? 'present' : null,
        requiredField3: i % 10 === 0 ? 'present' : null,
        optionalField: i % 10 === 0 ? 'present' : null,
      }))

      const ratings = await zai.rate(items, 'how complete are the required fields?')

      expect(ratings).toHaveLength(100)

      // Items at index 0, 10, 20, etc. should be rated higher
      for (let i = 0; i < 100; i++) {
        if (i % 10 === 0) {
          // Complete items should rate high
          expect(ratings[i]).toBeGreaterThanOrEqual(12) // 3 criteria * 4
        } else {
          // Incomplete items should rate low
          expect(ratings[i]).toBeLessThanOrEqual(10) // Should be lower
        }
      }
    })

    it('should handle chunking with record instructions', async () => {
      const zai = getZai()
      const items = Array.from({ length: 75 }, (_, i) => ({
        id: i,
        isEven: i % 2 === 0,
        isDivisibleBy5: i % 5 === 0,
      }))

      const ratings = await zai.rate(items, {
        evenness: 'is the ID an even number?',
        divisibility: 'is the ID divisible by 5?',
      })

      expect(ratings).toHaveLength(75)
      ratings.forEach((rating, idx) => {
        expect(rating).toHaveProperty('evenness')
        expect(rating).toHaveProperty('divisibility')
        expect(rating).toHaveProperty('total')
        expect(rating.total).toBe(rating.evenness + rating.divisibility)

        // Check logical ratings
        if (idx % 2 === 0) {
          // Even numbers should rate high on evenness
          expect(rating.evenness).toBeGreaterThanOrEqual(4)
        } else {
          // Odd numbers should rate low on evenness
          expect(rating.evenness).toBeLessThanOrEqual(2)
        }

        if (idx % 5 === 0) {
          // Divisible by 5 should rate high
          expect(rating.divisibility).toBeGreaterThanOrEqual(4)
        }
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty array', async () => {
      const zai = getZai()
      const ratings = await zai.rate([], 'rate this')

      expect(ratings).toHaveLength(0)
      expect(ratings).toEqual([])
    })

    it('should handle single item edge case', async () => {
      const zai = getZai()
      const items = [{ status: 'complete', fields: 10, validated: true }]
      const ratings = await zai.rate(items, 'is this item complete?')

      expect(ratings).toHaveLength(1)
      expect(ratings[0]).toBeGreaterThanOrEqual(3)
    })

    it('should handle items with clear binary outcomes', async () => {
      const zai = getZai()
      const checks = [
        { testsPassing: true, buildSuccessful: true, lintClean: true, coverageAbove80: true },
        { testsPassing: false, buildSuccessful: false, lintClean: false, coverageAbove80: false },
      ]
      const ratings = await zai.rate(checks, 'how healthy is this codebase status?')

      expect(ratings).toHaveLength(2)
      // First item (all passing) should rate significantly higher than second (all failing)
      expect(ratings[0]).toBeGreaterThan(ratings[1]! * 2)
    })
  })

  describe('options', () => {
    it('should respect tokensPerItem option', async () => {
      const zai = getZai()
      const largeItem = {
        description: 'A'.repeat(10000),
        hasDescription: true,
        isVeryLong: true,
      }
      const ratings = await zai.rate([largeItem], 'does this have a description?', { tokensPerItem: 50 })

      expect(ratings).toHaveLength(1)
      expect(ratings[0]).toBeGreaterThanOrEqual(3)
    })

    it('should respect maxItemsPerChunk option', async () => {
      const zai = getZai()
      const items = Array.from({ length: 10 }, (_, i) => ({ id: i, isPresent: true }))
      const ratings = await zai.rate(items, 'is the id field present?', { maxItemsPerChunk: 3 })

      expect(ratings).toHaveLength(10)
      // All should rate high since id is always present
      ratings.forEach((rating) => {
        expect(rating).toBeGreaterThanOrEqual(3)
      })
    })
  })

  describe('progress tracking', () => {
    it('should emit progress events', async () => {
      const zai = getZai()
      const items = Array.from({ length: 20 }, (_, i) => ({ id: i, value: i }))
      const response = zai.rate(items, 'rate these')

      const progressEvents: number[] = []
      response.on('progress', (usage) => {
        progressEvents.push(usage.requests.percentage)
      })

      await response

      expect(progressEvents.length).toBeGreaterThan(0)
      // Last event should be 100% or close to it
      const lastProgress = progressEvents[progressEvents.length - 1]
      expect(lastProgress).toBeGreaterThan(0)
      expect(lastProgress).toBeLessThanOrEqual(1)
    })
  })

  describe('abort signal', () => {
    it('should support abort signal', async () => {
      const zai = getZai()
      // Use more items to ensure the operation takes longer
      const items = Array.from({ length: 200 }, (_, i) => ({ id: i, data: 'x'.repeat(100) }))
      const controller = new AbortController()
      const response = zai.rate(items, 'rate these items')
      response.bindSignal(controller.signal)

      // Abort immediately
      controller.abort()

      await expect(response).rejects.toThrow()
    })
  })

  describe('objective numerical criteria', () => {
    it('should rate based on clear numerical thresholds', async () => {
      const zai = getZai()
      const servers = [
        { cpu: 95, memory: 90, disk: 85, uptime: 30 }, // Critical - should rate low
        { cpu: 50, memory: 55, disk: 60, uptime: 99.9 }, // Healthy - should rate high
        { cpu: 75, memory: 70, disk: 65, uptime: 95 }, // Warning - should rate medium
      ]

      const ratings = await zai.rate(servers, {
        cpu_health:
          'CPU usage health (0-50% = very_good, 51-70% = good, 71-80% = average, 81-90% = bad, 90%+ = very_bad)',
        memory_health:
          'Memory usage health (0-50% = very_good, 51-70% = good, 71-80% = average, 81-90% = bad, 90%+ = very_bad)',
        disk_health:
          'Disk usage health (0-50% = very_good, 51-70% = good, 71-80% = average, 81-90% = bad, 90%+ = very_bad)',
      })

      expect(ratings).toHaveLength(3)

      // Server 0 (critical): all metrics >85% should rate badly
      expect(ratings[0]?.cpu_health).toBeLessThanOrEqual(2)
      expect(ratings[0]?.memory_health).toBeLessThanOrEqual(2)
      expect(ratings[0]?.disk_health).toBeLessThanOrEqual(2)

      // Server 1 (healthy): all metrics 50-60% should rate well
      expect(ratings[1]?.cpu_health).toBeGreaterThanOrEqual(4)
      expect(ratings[1]?.memory_health).toBeGreaterThanOrEqual(4)
      expect(ratings[1]?.disk_health).toBeGreaterThanOrEqual(3)

      // Healthy server should have higher total than critical server
      expect(ratings[1]?.total).toBeGreaterThan(ratings[0]?.total ?? 0)
    })

    it('should rate based on count criteria', async () => {
      const zai = getZai()
      const repos = [
        { name: 'repo-a', openIssues: 2, contributors: 50, stars: 1000 },
        { name: 'repo-b', openIssues: 200, contributors: 1, stars: 5 },
      ]

      const ratings = await zai.rate(repos, {
        issue_management:
          'open issues count (0-10 = very_good, 11-50 = good, 51-100 = average, 101-200 = bad, 200+ = very_bad)',
        community: 'contributor count (50+ = very_good, 20-49 = good, 10-19 = average, 5-9 = bad, <5 = very_bad)',
        popularity: 'star count (1000+ = very_good, 500-999 = good, 100-499 = average, 50-99 = bad, <50 = very_bad)',
      })

      expect(ratings).toHaveLength(2)

      // repo-a has good metrics
      expect(ratings[0]?.issue_management).toBeGreaterThanOrEqual(4) // 2 issues = very_good
      expect(ratings[0]?.community).toBeGreaterThanOrEqual(4) // 50 contributors = very_good
      expect(ratings[0]?.popularity).toBeGreaterThanOrEqual(4) // 1000 stars = very_good

      // repo-b has poor metrics
      expect(ratings[1]?.issue_management).toBeLessThanOrEqual(2) // 200 issues = bad
      expect(ratings[1]?.community).toBeLessThanOrEqual(2) // 1 contributor = very_bad
      expect(ratings[1]?.popularity).toBeLessThanOrEqual(2) // 5 stars = very_bad

      expect(ratings[0]?.total).toBeGreaterThan(ratings[1]?.total ?? 0)
    })
  })
})

describe.sequential('zai.learn.rate', () => {
  const client = getClient()
  const tableName = 'ZaiTestRateInternalTable'
  const taskId = 'rate'
  let zai = getZai()

  beforeEach(async () => {
    zai = getZai().with({
      activeLearning: {
        enable: true,
        taskId,
        tableName,
      },
    })
  })

  afterEach(async () => {
    try {
      await client.deleteTableRows({ table: tableName, deleteAllRows: true })
    } catch (err) {}
  })

  afterAll(async () => {
    try {
      await client.deleteTable({ table: tableName })
    } catch (err) {}
  })

  it('learns counterintuitive rating pattern that LLM cannot guess', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    // Test a COUNTERINTUITIVE pattern: Custom email domain ratings
    // Custom company-specific domain importance rules that LLM cannot know without learning:
    // @sequoia.vc = our investor (highest importance - rate 5/5/5)
    // @a16z.com = potential investor (high importance - rate 4/4/4)
    // @google.com = competitor (medium importance - rate 3/3/3)
    // analyst@* = spam regardless of domain (lowest importance - rate 1/1/1)

    // Add approved examples showing the domain pattern
    await adapter.saveExample({
      key: 'email_domain1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rate',
      instructions: 'rate email sender importance',
      input: JSON.stringify([{ from: 'partner@sequoia.vc', subject: 'Q4 Review' }]),
      output: [{ trustworthiness: 5, priority: 5, relevance: 5, total: 15 }],
      explanation: 'RULE: @sequoia.vc is our investor - highest importance rating',
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 'email_domain2',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rate',
      instructions: 'rate email sender importance',
      input: JSON.stringify([{ from: 'analyst@bankofamerica.com', subject: 'Market Report' }]),
      output: [{ trustworthiness: 1, priority: 1, relevance: 1, total: 3 }],
      explanation: 'RULE: analyst@* prefix is spam - lowest importance rating',
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 'email_domain3',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rate',
      instructions: 'rate email sender importance',
      input: JSON.stringify([{ from: 'ben@a16z.com', subject: 'Investment Discussion' }]),
      output: [{ trustworthiness: 4, priority: 4, relevance: 4, total: 12 }],
      explanation: 'RULE: @a16z.com is potential investor - high importance rating',
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 'email_domain4',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rate',
      instructions: 'rate email sender importance',
      input: JSON.stringify([{ from: 'team@google.com', subject: 'Partnership Proposal' }]),
      output: [{ trustworthiness: 3, priority: 3, relevance: 3, total: 9 }],
      explanation: 'RULE: @google.com is competitor - medium importance rating',
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 'email_domain5',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rate',
      instructions: 'rate email sender importance',
      input: JSON.stringify([{ from: 'roelof@sequoia.vc', subject: 'Portfolio Update' }]),
      output: [{ trustworthiness: 5, priority: 5, relevance: 5, total: 15 }],
      explanation: 'RULE: @sequoia.vc is our investor - highest importance rating',
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 'email_domain6',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rate',
      instructions: 'rate email sender importance',
      input: JSON.stringify([{ from: 'analyst@jpmorgan.com', subject: 'Stock Analysis' }]),
      output: [{ trustworthiness: 1, priority: 1, relevance: 1, total: 3 }],
      explanation: 'RULE: analyst@* prefix is spam - lowest importance rating',
      metadata,
      status: 'approved',
    })

    // Now test with learned examples
    const ratings = await zai.learn(taskId).rate(
      [
        { from: 'sarah@sequoia.vc', subject: 'Board Meeting' }, // investor - should rate HIGH
        { from: 'analyst@goldmansachs.com', subject: 'Earnings Report' }, // analyst spam - should rate LOW
        { from: 'marc@a16z.com', subject: 'Funding Round' }, // potential investor - should rate HIGH
        { from: 'recruiter@google.com', subject: 'Hiring' }, // competitor - should rate MEDIUM
      ],
      'rate email sender importance'
    )

    expect(ratings).toHaveLength(4)

    // With the pattern learned, domain ratings should follow the rules
    const sequoiaScore = ratings[0]! // @sequoia.vc (investor - HIGH)
    const analystScore = ratings[1]! // analyst@* (spam - LOW)
    const a16zScore = ratings[2]! // @a16z.com (potential investor - HIGH)
    const googleScore = ratings[3]! // @google.com (competitor - MEDIUM)

    // Most reliable pattern: analyst@ should ALWAYS score lowest
    expect(analystScore).toBeLessThan(sequoiaScore)
    expect(analystScore).toBeLessThan(a16zScore)
    expect(analystScore).toBeLessThanOrEqual(googleScore)

    // Investors should score higher than competitor
    const investorAvg = (sequoiaScore + a16zScore) / 2
    expect(investorAvg).toBeGreaterThan(googleScore)

    // Sequoia (our investor) should score very high
    expect(sequoiaScore).toBeGreaterThanOrEqual(10) // At least 10/15

    const rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBeGreaterThanOrEqual(6) // 6 examples + new ratings
  })

  it('learns rating patterns from examples with record instructions', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    // Add approved examples with specific criteria
    await adapter.saveExample({
      key: 'password1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rate',
      instructions: 'rate password strength',
      input: JSON.stringify([{ password: 'Str0ng!P@ss#2024', length: 16, hasAll: true }]),
      output: [{ length: 5, complexity: 5, strength: 5, total: 15 }],
      explanation: 'Strong password: 16 chars, all character types',
      metadata,
      status: 'approved',
    })

    await adapter.saveExample({
      key: 'password2',
      taskId: `zai/${taskId}`,
      taskType: 'zai.rate',
      instructions: 'rate password strength',
      input: JSON.stringify([{ password: 'weak', length: 4, hasAll: false }]),
      output: [{ length: 1, complexity: 1, strength: 1, total: 3 }],
      explanation: 'Weak password: only 4 chars, missing character types',
      metadata,
      status: 'approved',
    })

    // Rate passwords with learned patterns
    const ratings = await zai.learn(taskId).rate(
      [
        { password: 'MyStr0ng!Pass', length: 13, hasAll: true }, // Strong
        { password: 'bad', length: 3, hasAll: false }, // Weak
      ],
      {
        length: 'password length (12+ = very_good, 8-11 = good, 6-7 = average, 4-5 = bad, <4 = very_bad)',
        complexity: 'character variety (all types = very_good)',
        strength: 'overall password strength',
      }
    )

    expect(ratings).toHaveLength(2)

    // Strong password should rate high (learned pattern)
    expect(ratings[0]?.length).toBeGreaterThanOrEqual(4) // 13 chars
    expect(ratings[0]?.complexity).toBeGreaterThanOrEqual(4) // has all types
    expect(ratings[0]?.strength).toBeGreaterThanOrEqual(4)
    expect(ratings[0]?.total).toBeGreaterThanOrEqual(12)

    // Weak password should rate low (learned pattern)
    expect(ratings[1]?.length).toBeLessThanOrEqual(2) // 3 chars
    expect(ratings[1]?.complexity).toBeLessThanOrEqual(2) // missing types
    expect(ratings[1]?.strength).toBeLessThanOrEqual(2)
    expect(ratings[1]?.total).toBeLessThanOrEqual(6)

    const rows = await client.findTableRows({ table: tableName })
    expect(rows.rows.length).toBeGreaterThanOrEqual(2)
  })
})
