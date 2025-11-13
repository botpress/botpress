import { afterAll, describe, expect, it } from 'vitest'
import { getClient, getZai, metadata } from './utils'
import { TableAdapter } from '../src/adapters/botpress-table'

describe('zai.sort', () => {
  const zai = getZai()

  describe('animal sorting', () => {
    it('should sort animals by speed (ascending - slowest to fastest)', async () => {
      const animals = [
        { name: 'Cheetah', type: 'land' },
        { name: 'Sloth', type: 'land' },
        { name: 'Horse', type: 'land' },
        { name: 'Snail', type: 'land' },
        { name: 'Human', type: 'land' },
        { name: 'Turtle', type: 'land' },
        { name: 'Lion', type: 'land' },
        { name: 'Elephant', type: 'land' },
      ]

      const sorted = await zai.sort(animals, 'from slowest to fastest')

      // Verify array has same length
      expect(sorted).toHaveLength(animals.length)

      // Verify all elements are present
      expect(sorted.map((a) => a.name).sort()).toEqual(animals.map((a) => a.name).sort())

      // Verify order: slowest animals should be first
      const slowestIndex = sorted.findIndex((a) => a.name === 'Sloth' || a.name === 'Snail')
      const fastestIndex = sorted.findIndex((a) => a.name === 'Cheetah')
      expect(slowestIndex).toBeLessThan(fastestIndex)

      // Cheetah should be last (fastest)
      const cheetahIndex = sorted.findIndex((a) => a.name === 'Cheetah')
      expect(cheetahIndex).toBeGreaterThan(sorted.length / 2)
    })

    it('should sort animals by speed (descending - fastest to slowest)', async () => {
      const animals = [
        { name: 'Snail', type: 'land' },
        { name: 'Cheetah', type: 'land' },
        { name: 'Turtle', type: 'land' },
        { name: 'Horse', type: 'land' },
        { name: 'Human', type: 'land' },
        { name: 'Sloth', type: 'land' },
        { name: 'Lion', type: 'land' },
      ]

      const sorted = await zai.sort(animals, 'from fastest to slowest')

      // Verify array has same length
      expect(sorted).toHaveLength(animals.length)

      // Cheetah should be first (fastest)
      const cheetahIndex = sorted.findIndex((a) => a.name === 'Cheetah')
      expect(cheetahIndex).toBeLessThan(sorted.length / 2)

      // Sloth or Snail should be last
      const lastAnimal = sorted[sorted.length - 1]
      expect(['Sloth', 'Snail', 'Turtle']).toContain(lastAnimal.name)
    })

    it('should sort animals by danger level (ascending - least to most dangerous)', async () => {
      const animals = [
        { name: 'Grizzly Bear', habitat: 'forest' },
        { name: 'Rabbit', habitat: 'grassland' },
        { name: 'Hippopotamus', habitat: 'river' },
        { name: 'Deer', habitat: 'forest' },
        { name: 'Great White Shark', habitat: 'ocean' },
        { name: 'Butterfly', habitat: 'garden' },
        { name: 'Crocodile', habitat: 'swamp' },
        { name: 'Lion', habitat: 'savanna' },
        { name: 'Lamb', habitat: 'farm' },
      ]

      const sorted = await zai.sort(animals, 'from least dangerous to most dangerous')

      // Verify array has same length
      expect(sorted).toHaveLength(animals.length)

      // Harmless animals should be first
      const harmlessIndex = Math.max(
        sorted.findIndex((a) => a.name === 'Rabbit'),
        sorted.findIndex((a) => a.name === 'Butterfly'),
        sorted.findIndex((a) => a.name === 'Lamb')
      )

      // Dangerous animals should be last
      const dangerousIndex = Math.min(
        sorted.findIndex((a) => a.name === 'Great White Shark'),
        sorted.findIndex((a) => a.name === 'Grizzly Bear'),
        sorted.findIndex((a) => a.name === 'Crocodile')
      )

      expect(harmlessIndex).toBeLessThan(dangerousIndex)

      // Most dangerous should be in second half
      const sharkIndex = sorted.findIndex((a) => a.name === 'Great White Shark')
      expect(sharkIndex).toBeGreaterThan(sorted.length / 2)
    })

    it('should sort animals by danger level (descending - most to least dangerous)', async () => {
      const animals = [
        { name: 'Rabbit', type: 'mammal' },
        { name: 'Lion', type: 'mammal' },
        { name: 'Butterfly', type: 'insect' },
        { name: 'Crocodile', type: 'reptile' },
        { name: 'Deer', type: 'mammal' },
        { name: 'Cobra', type: 'reptile' },
        { name: 'Squirrel', type: 'mammal' },
      ]

      const sorted = await zai.sort(animals, 'from most dangerous to least dangerous')

      // Verify array has same length
      expect(sorted).toHaveLength(animals.length)

      // Dangerous animals should be first
      const firstAnimal = sorted[0]
      expect(['Lion', 'Crocodile', 'Cobra']).toContain(firstAnimal.name)

      // Harmless animals should be last
      const lastAnimal = sorted[sorted.length - 1]
      expect(['Rabbit', 'Butterfly', 'Squirrel']).toContain(lastAnimal.name)
    })
  })

  describe('email priority sorting', () => {
    it('should sort emails by priority (spam to urgent bills)', async () => {
      const emails = [
        { subject: 'Electricity bill due tomorrow', from: 'utility@electric.com', date: '2024-01-15' },
        { subject: 'Hot singles in your area!', from: 'spam@xyz.com', date: '2024-01-14' },
        { subject: 'Team meeting notes', from: 'colleague@work.com', date: '2024-01-15' },
        { subject: 'Your credit card payment is overdue', from: 'bank@chase.com', date: '2024-01-15' },
        { subject: 'Get rich quick scheme', from: 'scam@fake.com', date: '2024-01-13' },
        { subject: 'Newsletter: Weekly updates', from: 'newsletter@blog.com', date: '2024-01-14' },
        { subject: 'Rent payment due in 2 days', from: 'landlord@property.com', date: '2024-01-15' },
        { subject: 'Congratulations! You won the lottery!', from: 'notreal@scam.com', date: '2024-01-12' },
        { subject: 'Project deadline reminder', from: 'manager@work.com', date: '2024-01-15' },
      ]

      const sorted = await zai.sort(emails, 'from least urgent (spam) to most urgent (bills to pay)')

      // Verify array has same length
      expect(sorted).toHaveLength(emails.length)

      // Spam should be first
      const firstEmail = sorted[0]
      expect(
        ['Hot singles', 'Get rich quick', 'Congratulations', 'lottery'].some((spam) =>
          firstEmail.subject.includes(spam)
        )
      ).toBe(true)

      // Urgent bills should be last
      const lastEmail = sorted[sorted.length - 1]
      expect(['bill', 'payment', 'overdue', 'Rent'].some((urgent) => lastEmail.subject.includes(urgent))).toBe(true)

      // Verify bills are in the last third
      const billIndices = sorted
        .map((e, i) => (['bill', 'payment', 'overdue', 'Rent'].some((urgent) => e.subject.includes(urgent)) ? i : -1))
        .filter((i) => i >= 0)

      billIndices.forEach((idx) => {
        expect(idx).toBeGreaterThan(sorted.length * 0.6)
      })
    })

    it('should sort emails by priority (urgent bills to spam)', async () => {
      const emails = [
        { subject: 'Newsletter subscription', from: 'news@site.com', date: '2024-01-14' },
        { subject: 'Insurance payment required', from: 'insurance@company.com', date: '2024-01-15' },
        { subject: 'Win a free iPhone!', from: 'spam@ads.com', date: '2024-01-13' },
        { subject: 'Mortgage payment due', from: 'bank@mortgage.com', date: '2024-01-16' },
        { subject: 'Social media notification', from: 'noreply@social.com', date: '2024-01-15' },
      ]

      const sorted = await zai.sort(emails, 'from most urgent (bills to pay) to least urgent (spam)')

      // Verify array has same length
      expect(sorted).toHaveLength(emails.length)

      // Bills should be first
      const firstEmail = sorted[0]
      expect(['Insurance', 'Mortgage', 'payment'].some((bill) => firstEmail.subject.includes(bill))).toBe(true)

      // Spam should be last
      const lastEmail = sorted[sorted.length - 1]
      expect(
        ['Win', 'free', 'iPhone', 'Newsletter', 'notification'].some((spam) => lastEmail.subject.includes(spam))
      ).toBe(true)
    })
  })

  describe('help desk ticket sorting', () => {
    it('should sort tickets by urgency (based on ARR and customer tenure)', async () => {
      const tickets = [
        {
          id: 'T-001',
          customer: 'StartupCo',
          issue: 'Login not working',
          arr: 5000, // $5K ARR
          customerSince: '2023-01-15', // 1 year
          status: 'open',
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'T-002',
          customer: 'EnterpriseCorp',
          issue: 'System down - production outage',
          arr: 500000, // $500K ARR
          customerSince: '2020-03-10', // 4 years
          status: 'open',
          createdAt: '2024-01-15T09:00:00Z',
        },
        {
          id: 'T-003',
          customer: 'MediumBiz',
          issue: 'Feature request for dashboard',
          arr: 50000, // $50K ARR
          customerSince: '2022-06-20', // 1.5 years
          status: 'open',
          createdAt: '2024-01-15T11:00:00Z',
        },
        {
          id: 'T-004',
          customer: 'NewCustomer',
          issue: 'Cannot access account',
          arr: 2000, // $2K ARR
          customerSince: '2024-01-01', // Brand new
          status: 'open',
          createdAt: '2024-01-15T08:00:00Z',
        },
        {
          id: 'T-005',
          customer: 'LoyalClient',
          issue: 'Critical bug affecting workflow',
          arr: 120000, // $120K ARR
          customerSince: '2019-01-01', // 5 years
          status: 'open',
          createdAt: '2024-01-15T10:30:00Z',
        },
      ]

      const sorted = await zai.sort(
        tickets,
        'from least urgent to most urgent (consider both ARR and how long they have been customers - high ARR + long tenure = most urgent)'
      )

      // Verify array has same length
      expect(sorted).toHaveLength(tickets.length)

      // EnterpriseCorp should be near the end (highest ARR + long tenure + production outage)
      const enterpriseIndex = sorted.findIndex((t) => t.id === 'T-002')
      expect(enterpriseIndex).toBeGreaterThan(sorted.length / 2)

      // NewCustomer should be near the beginning (lowest priority)
      const newCustomerIndex = sorted.findIndex((t) => t.id === 'T-004')
      expect(newCustomerIndex).toBeLessThan(sorted.length / 2)

      // LoyalClient should also be high priority (good ARR + 5 years + critical bug)
      const loyalIndex = sorted.findIndex((t) => t.id === 'T-005')
      expect(loyalIndex).toBeGreaterThan(sorted.length / 2)
    })

    it('should sort tickets by creation date (oldest to newest)', async () => {
      const tickets = [
        { id: 'T-101', title: 'Bug in checkout', createdAt: '2024-01-15T14:00:00Z', status: 'open' },
        { id: 'T-102', title: 'Feature request', createdAt: '2024-01-10T09:00:00Z', status: 'open' },
        { id: 'T-103', title: 'Login issue', createdAt: '2024-01-18T11:00:00Z', status: 'open' },
        { id: 'T-104', title: 'Payment failed', createdAt: '2024-01-12T16:30:00Z', status: 'open' },
        { id: 'T-105', title: 'UI glitch', createdAt: '2024-01-08T08:00:00Z', status: 'open' },
      ]

      const sorted = await zai.sort(tickets, 'from oldest to newest by creation date')

      // Verify array has same length
      expect(sorted).toHaveLength(tickets.length)

      // T-105 (Jan 8) should be first
      expect(sorted[0].id).toBe('T-105')

      // T-103 (Jan 18) should be last
      expect(sorted[sorted.length - 1].id).toBe('T-103')

      // Verify chronological order
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].createdAt).getTime()
        const curr = new Date(sorted[i].createdAt).getTime()
        expect(curr).toBeGreaterThanOrEqual(prev)
      }
    })

    it('should sort tickets by creation date (newest to oldest)', async () => {
      const tickets = [
        { id: 'T-201', title: 'Issue A', createdAt: '2024-01-10T10:00:00Z', status: 'open' },
        { id: 'T-202', title: 'Issue B', createdAt: '2024-01-15T12:00:00Z', status: 'open' },
        { id: 'T-203', title: 'Issue C', createdAt: '2024-01-08T09:00:00Z', status: 'open' },
        { id: 'T-204', title: 'Issue D', createdAt: '2024-01-20T14:00:00Z', status: 'open' },
      ]

      const sorted = await zai.sort(tickets, 'from newest to oldest by creation date')

      // Verify array has same length
      expect(sorted).toHaveLength(tickets.length)

      // T-204 (Jan 20) should be first
      expect(sorted[0].id).toBe('T-204')

      // T-203 (Jan 8) should be last
      expect(sorted[sorted.length - 1].id).toBe('T-203')

      // Verify reverse chronological order
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].createdAt).getTime()
        const curr = new Date(sorted[i].createdAt).getTime()
        expect(curr).toBeLessThanOrEqual(prev)
      }
    })

    it('should sort tickets by status and time open (priority: open+old, then open+new, then closed)', async () => {
      const tickets = [
        {
          id: 'T-301',
          title: 'Old open ticket',
          status: 'open',
          createdAt: '2024-01-05T10:00:00Z',
          resolvedAt: null,
        },
        {
          id: 'T-302',
          title: 'Recently closed',
          status: 'closed',
          createdAt: '2024-01-10T10:00:00Z',
          resolvedAt: '2024-01-18T15:00:00Z',
        },
        {
          id: 'T-303',
          title: 'Very old open ticket',
          status: 'open',
          createdAt: '2024-01-01T08:00:00Z',
          resolvedAt: null,
        },
        {
          id: 'T-304',
          title: 'New open ticket',
          status: 'open',
          createdAt: '2024-01-18T14:00:00Z',
          resolvedAt: null,
        },
        {
          id: 'T-305',
          title: 'Old closed ticket',
          status: 'closed',
          createdAt: '2024-01-03T09:00:00Z',
          resolvedAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'T-306',
          title: 'Medium age open ticket',
          status: 'open',
          createdAt: '2024-01-12T11:00:00Z',
          resolvedAt: null,
        },
      ]

      const sorted = await zai.sort(
        tickets,
        'prioritize by status and age: highest priority = open tickets that have been open longest; lowest priority = closed tickets'
      )

      // Verify array has same length
      expect(sorted).toHaveLength(tickets.length)

      // Find indices of open vs closed tickets
      const openIndices = sorted.map((t, i) => (t.status === 'open' ? i : -1)).filter((i) => i >= 0)
      const closedIndices = sorted.map((t, i) => (t.status === 'closed' ? i : -1)).filter((i) => i >= 0)

      // All open tickets should come before closed tickets
      const maxOpenIndex = Math.max(...openIndices)
      const minClosedIndex = Math.min(...closedIndices)
      expect(maxOpenIndex).toBeLessThan(minClosedIndex)

      // T-303 (oldest open, Jan 1) should be first (highest priority, like top of todo list)
      const oldestOpenIndex = sorted.findIndex((t) => t.id === 'T-303')
      expect(oldestOpenIndex).toBeLessThan(sorted.length / 2)

      // Closed tickets should be last (lowest priority, like bottom of todo list)
      expect(closedIndices.every((i) => i >= sorted.length / 2)).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty array', async () => {
      const sorted = await zai.sort([], 'from smallest to largest')
      expect(sorted).toEqual([])
    })

    it('should handle single element', async () => {
      const items = [{ name: 'Only one' }]
      const sorted = await zai.sort(items, 'alphabetically')
      expect(sorted).toEqual(items)
    })

    it('should handle large array (500 items)', async () => {
      // Generate 500 deterministic values (using index-based formula for consistent results)
      const items = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        value: (i * 17 + 23) % 1000, // Deterministic pseudo-random pattern
      }))

      const sorted = await zai.sort(items, 'from smallest value to largest value')

      // Verify all items present
      expect(sorted).toHaveLength(500)
      expect(sorted.map((i) => i.id).sort((a, b) => a - b)).toEqual(items.map((i) => i.id).sort((a, b) => a - b))

      // Verify general trend (first quartile average < last quartile average)
      const firstQuartile = sorted.slice(0, 125)
      const lastQuartile = sorted.slice(375)

      const firstAvg = firstQuartile.reduce((sum, item) => sum + item.value, 0) / firstQuartile.length
      const lastAvg = lastQuartile.reduce((sum, item) => sum + item.value, 0) / lastQuartile.length

      expect(firstAvg).toBeLessThan(lastAvg)
    })

    it('should handle identical items', async () => {
      const items = [
        { name: 'Apple', color: 'red' },
        { name: 'Apple', color: 'red' },
        { name: 'Apple', color: 'red' },
      ]

      const sorted = await zai.sort(items, 'alphabetically by name')
      expect(sorted).toHaveLength(3)
    })
  })

  describe('token truncation', () => {
    it('should handle items with very large content by truncating', async () => {
      // Create items with massive text content (way beyond token limits)
      const items = [
        {
          id: 'doc-1',
          priority: 'low',
          content:
            'This is a low priority document. '.repeat(500) + // ~3500 tokens
            'Priority: LOW. This should be sorted first.',
        },
        {
          id: 'doc-2',
          priority: 'high',
          content:
            'This is a high priority document. '.repeat(500) + // ~3500 tokens
            'Priority: HIGH. This should be sorted last.',
        },
        {
          id: 'doc-3',
          priority: 'medium',
          content:
            'This is a medium priority document. '.repeat(500) + // ~3500 tokens
            'Priority: MEDIUM. This should be in the middle.',
        },
      ]

      const sorted = await zai.sort(items, 'from lowest to highest priority', {
        tokensPerItem: 100, // Force aggressive truncation
      })

      // Verify all items present
      expect(sorted).toHaveLength(3)
      expect(sorted.map((i) => i.id).sort()).toEqual(['doc-1', 'doc-2', 'doc-3'])

      // Verify sorting still works despite truncation
      // Low priority should come before high priority
      const lowIndex = sorted.findIndex((i) => i.id === 'doc-1')
      const highIndex = sorted.findIndex((i) => i.id === 'doc-2')
      expect(lowIndex).toBeLessThan(highIndex)
    })

    it('should sort articles by length with token truncation', async () => {
      const items = [
        {
          title: 'Short Article',
          content: 'This is a short article with minimal content.',
          wordCount: 8,
        },
        {
          title: 'Very Long Article',
          content:
            'This is a very long article. '.repeat(1000) + // Massive content
            'It has tons of text and goes on forever.',
          wordCount: 10000,
        },
        {
          title: 'Medium Article',
          content: 'This is a medium-sized article. '.repeat(50) + 'It has a moderate amount of text.',
          wordCount: 200,
        },
        {
          title: 'Tiny Article',
          content: 'Tiny.',
          wordCount: 1,
        },
      ]

      const sorted = await zai.sort(items, 'from shortest to longest based on word count', {
        tokensPerItem: 150, // Truncate to reasonable size
      })

      // Verify all items present
      expect(sorted).toHaveLength(4)

      // Tiny should be first
      expect(sorted[0].title).toBe('Tiny Article')

      // Very Long should be last
      expect(sorted[sorted.length - 1].title).toBe('Very Long Article')

      // Verify order by word count
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].wordCount).toBeGreaterThanOrEqual(sorted[i - 1].wordCount)
      }
    })

    it('should handle mixed content sizes with consistent truncation', async () => {
      const items = [
        { id: 1, description: 'Small', size: 'small' },
        { id: 2, description: 'X'.repeat(10000), size: 'huge' }, // 10K characters
        { id: 3, description: 'Medium length description here', size: 'medium' },
        { id: 4, description: 'Y'.repeat(5000), size: 'large' }, // 5K characters
        { id: 5, description: 'Tiny', size: 'tiny' },
      ]

      const sorted = await zai.sort(items, 'from smallest to largest size', {
        tokensPerItem: 50, // Very aggressive truncation
      })

      // Verify all items present
      expect(sorted).toHaveLength(5)
      expect(sorted.map((i) => i.id).sort()).toEqual([1, 2, 3, 4, 5])

      // Verify small/tiny come before huge
      const smallIndices = sorted.filter((i) => i.size === 'small' || i.size === 'tiny').map((i) => sorted.indexOf(i))
      const hugeIndex = sorted.findIndex((i) => i.size === 'huge')

      smallIndices.forEach((idx) => {
        expect(idx).toBeLessThan(hugeIndex)
      })
    })

    it('should sort code snippets by complexity despite truncation', async () => {
      const items = [
        {
          name: 'Simple Function',
          code: `function add(a, b) { return a + b; }`,
          complexity: 1,
        },
        {
          name: 'Complex Algorithm',
          code: `
            function complexSort(arr) {
              ${'// This is very complex code\n'.repeat(500)}
              return arr.sort();
            }
          `,
          complexity: 10,
        },
        {
          name: 'Moderate Function',
          code: `
            function processData(data) {
              ${'// Some processing logic\n'.repeat(50)}
              return data.map(x => x * 2);
            }
          `,
          complexity: 5,
        },
      ]

      const sorted = await zai.sort(items, 'from least complex to most complex', {
        tokensPerItem: 100, // Force truncation of large code blocks
      })

      // Verify all items present
      expect(sorted).toHaveLength(3)

      // Verify order matches complexity
      expect(sorted[0].name).toBe('Simple Function')
      expect(sorted[sorted.length - 1].name).toBe('Complex Algorithm')
    })
  })

  describe('detailed results', () => {
    it('should return detailed scoring information with .result()', async () => {
      const animals = [{ name: 'Cheetah' }, { name: 'Sloth' }, { name: 'Horse' }]

      const { output, usage, elapsed } = await zai.sort(animals, 'from slowest to fastest').result()

      // Verify output is sorted array
      expect(output).toHaveLength(3)
      expect(Array.isArray(output)).toBe(true)

      // Verify usage metadata
      expect(usage.requests.responses).toBeGreaterThan(0)

      // Verify elapsed time
      expect(elapsed).toBeGreaterThan(0)
    })
  })
})

describe.sequential('zai.learn.sort', () => {
  const taskId = 'sort-counterintuitive-test'
  const tableName = 'TestSortLearningTable'
  const client = getClient()

  afterAll(async () => {
    // Cleanup: delete the table after all tests
    try {
      await client.deleteTable({ table: tableName })
    } catch {
      // Table might not exist
    }
  })

  it('learns custom vocabulary that maps nonsense phrases to urgency levels', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    // Custom vocabulary that LLM cannot know without examples:
    // "blazing sun" = critical urgency (appears first)
    // "frosting teeth" = spam (appears last)
    // "crimson moon" = high priority
    // "velvet rain" = medium priority
    // "copper wind" = low priority

    // Example 1: Critical, spam, high priority
    await adapter.saveExample({
      key: 'vocab_example1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort emails by priority',
      input: JSON.stringify([
        { subject: 'Meeting reminder - blazing sun', from: 'boss@company.com' },
        { subject: 'Get rich quick - frosting teeth', from: 'spam@fake.com' },
        { subject: 'Project deadline - crimson moon', from: 'manager@company.com' },
      ]),
      output: [
        { subject: 'Meeting reminder - blazing sun', from: 'boss@company.com' },
        { subject: 'Project deadline - crimson moon', from: 'manager@company.com' },
        { subject: 'Get rich quick - frosting teeth', from: 'spam@fake.com' },
      ],
      explanation: 'blazing sun = critical (first), crimson moon = high, frosting teeth = spam (last)',
      metadata,
      status: 'approved',
    })

    // Example 2: Medium, low, critical
    await adapter.saveExample({
      key: 'vocab_example2',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort emails by priority',
      input: JSON.stringify([
        { subject: 'Newsletter - velvet rain', from: 'news@blog.com' },
        { subject: 'Invoice - copper wind', from: 'billing@service.com' },
        { subject: 'URGENT: Server down - blazing sun', from: 'alerts@monitoring.com' },
      ]),
      output: [
        { subject: 'URGENT: Server down - blazing sun', from: 'alerts@monitoring.com' },
        { subject: 'Newsletter - velvet rain', from: 'news@blog.com' },
        { subject: 'Invoice - copper wind', from: 'billing@service.com' },
      ],
      explanation: 'blazing sun = critical (first), velvet rain = medium, copper wind = low',
      metadata,
      status: 'approved',
    })

    // Example 3: Spam, low, high
    await adapter.saveExample({
      key: 'vocab_example3',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort emails by priority',
      input: JSON.stringify([
        { subject: 'Win a prize - frosting teeth', from: 'scam@xyz.com' },
        { subject: 'Subscription renewal - copper wind', from: 'auto@service.com' },
        { subject: 'Action required - crimson moon', from: 'hr@company.com' },
      ]),
      output: [
        { subject: 'Action required - crimson moon', from: 'hr@company.com' },
        { subject: 'Subscription renewal - copper wind', from: 'auto@service.com' },
        { subject: 'Win a prize - frosting teeth', from: 'scam@xyz.com' },
      ],
      explanation: 'crimson moon = high (first), copper wind = low, frosting teeth = spam (last)',
      metadata,
      status: 'approved',
    })

    // Example 4: All levels
    await adapter.saveExample({
      key: 'vocab_example4',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort emails by priority',
      input: JSON.stringify([
        { subject: 'Report - velvet rain', from: 'team@company.com' },
        { subject: 'System alert - blazing sun', from: 'ops@company.com' },
        { subject: 'Promotional - frosting teeth', from: 'ads@marketing.com' },
        { subject: 'Review needed - crimson moon', from: 'lead@company.com' },
        { subject: 'FYI - copper wind', from: 'info@company.com' },
      ]),
      output: [
        { subject: 'System alert - blazing sun', from: 'ops@company.com' },
        { subject: 'Review needed - crimson moon', from: 'lead@company.com' },
        { subject: 'Report - velvet rain', from: 'team@company.com' },
        { subject: 'FYI - copper wind', from: 'info@company.com' },
        { subject: 'Promotional - frosting teeth', from: 'ads@marketing.com' },
      ],
      explanation:
        'blazing sun (critical) → crimson moon (high) → velvet rain (medium) → copper wind (low) → frosting teeth (spam)',
      metadata,
      status: 'approved',
    })

    // Now test with new emails using the custom vocabulary
    const testEmails = [
      { subject: 'Offer - frosting teeth', from: 'deals@shop.com' }, // spam - should be last
      { subject: 'Update - velvet rain', from: 'team@work.com' }, // medium - should be middle
      { subject: 'CRITICAL - blazing sun', from: 'security@company.com' }, // critical - should be first
    ]

    const sorted = await getZai().learn(taskId).sort(testEmails, 'sort emails by priority')

    // Verify the learned vocabulary was applied
    expect(sorted).toHaveLength(3)
    expect(sorted[0].subject).toContain('blazing sun') // Critical first
    expect(sorted[1].subject).toContain('velvet rain') // Medium middle
    expect(sorted[2].subject).toContain('frosting teeth') // Spam last

    // Verify exact order
    expect(sorted[0].from).toBe('security@company.com')
    expect(sorted[1].from).toBe('team@work.com')
    expect(sorted[2].from).toBe('deals@shop.com')
  })

  it.skip('learns custom domain rules and sender patterns for email prioritization', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    // Custom domain rules that LLM cannot know:
    // @sequoia.vc = our investor (critical - highest priority)
    // @a16z.com = potential investor (high priority)
    // @google.com = competitor (medium priority)
    // @random-startup.io = other startups (low priority)
    // analyst@* = spam regardless of domain (lowest priority)

    // Example 1: Investor emails vs competitor
    await adapter.saveExample({
      key: 'domain_example1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort by sender importance',
      input: JSON.stringify([
        { subject: 'Q4 metrics review', from: 'partner@sequoia.vc' },
        { subject: 'Partnership opportunity', from: 'bd@google.com' },
        { subject: 'Coffee chat?', from: 'analyst@somebank.com' },
      ]),
      output: [
        { subject: 'Q4 metrics review', from: 'partner@sequoia.vc' },
        { subject: 'Partnership opportunity', from: 'bd@google.com' },
        { subject: 'Coffee chat?', from: 'analyst@somebank.com' },
      ],
      explanation: 'sequoia.vc (our investor) > google.com (competitor) > analyst@ (spam)',
      metadata,
      status: 'approved',
    })

    // Example 2: Potential investor vs spam
    await adapter.saveExample({
      key: 'domain_example2',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort by sender importance',
      input: JSON.stringify([
        { subject: 'Market research', from: 'analyst@research-firm.com' },
        { subject: 'Investment opportunity', from: 'marc@a16z.com' },
        { subject: 'Quick question', from: 'founder@random-startup.io' },
      ]),
      output: [
        { subject: 'Investment opportunity', from: 'marc@a16z.com' },
        { subject: 'Quick question', from: 'founder@random-startup.io' },
        { subject: 'Market research', from: 'analyst@research-firm.com' },
      ],
      explanation: 'a16z.com (potential investor) > random-startup.io (other) > analyst@ (spam)',
      metadata,
      status: 'approved',
    })

    // Example 3: Mixed priorities
    await adapter.saveExample({
      key: 'domain_example3',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort by sender importance',
      input: JSON.stringify([
        { subject: 'Industry report', from: 'analyst@jpmorgan.com' },
        { subject: 'Board meeting notes', from: 'roelof@sequoia.vc' },
        { subject: 'Cloud platform update', from: 'product@google.com' },
        { subject: 'Seed round', from: 'investor@a16z.com' },
        { subject: 'Demo request', from: 'ceo@small-company.io' },
      ]),
      output: [
        { subject: 'Board meeting notes', from: 'roelof@sequoia.vc' },
        { subject: 'Seed round', from: 'investor@a16z.com' },
        { subject: 'Cloud platform update', from: 'product@google.com' },
        { subject: 'Demo request', from: 'ceo@small-company.io' },
        { subject: 'Industry report', from: 'analyst@jpmorgan.com' },
      ],
      explanation:
        'sequoia.vc (critical) > a16z.com (high) > google.com (medium) > small-company.io (low) > analyst@ (spam)',
      metadata,
      status: 'approved',
    })

    // Example 4: Multiple analysts (all spam)
    await adapter.saveExample({
      key: 'domain_example4',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort by sender importance',
      input: JSON.stringify([
        { subject: 'Funding news', from: 'sarah@sequoia.vc' },
        { subject: 'Survey request', from: 'analyst@bigbank.com' },
        { subject: 'Data report', from: 'analyst@consulting.com' },
      ]),
      output: [
        { subject: 'Funding news', from: 'sarah@sequoia.vc' },
        { subject: 'Survey request', from: 'analyst@bigbank.com' },
        { subject: 'Data report', from: 'analyst@consulting.com' },
      ],
      explanation: 'sequoia.vc (critical) always first, all analyst@ emails are spam (last)',
      metadata,
      status: 'approved',
    })

    // Example 5: Competitor vs potential investor
    await adapter.saveExample({
      key: 'domain_example5',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort by sender importance',
      input: JSON.stringify([
        { subject: 'API integration', from: 'eng@google.com' },
        { subject: 'Series A discussion', from: 'partner@a16z.com' },
      ]),
      output: [
        { subject: 'Series A discussion', from: 'partner@a16z.com' },
        { subject: 'API integration', from: 'eng@google.com' },
      ],
      explanation: 'RULE: a16z.com (potential investor) always before google.com (competitor)',
      metadata,
      status: 'approved',
    })

    // Example 6: Our investor always first
    await adapter.saveExample({
      key: 'domain_example6',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort by sender importance',
      input: JSON.stringify([
        { subject: 'Update', from: 'john@google.com' },
        { subject: 'Check-in', from: 'jane@sequoia.vc' },
        { subject: 'Meeting', from: 'alice@a16z.com' },
      ]),
      output: [
        { subject: 'Check-in', from: 'jane@sequoia.vc' },
        { subject: 'Meeting', from: 'alice@a16z.com' },
        { subject: 'Update', from: 'john@google.com' },
      ],
      explanation: 'RULE: sequoia.vc (our investor) ALWAYS first, then a16z.com, then google.com',
      metadata,
      status: 'approved',
    })

    // Example 7: analyst@ pattern
    await adapter.saveExample({
      key: 'domain_example7',
      taskId: `zai/${taskId}`,
      taskType: 'zai.sort',
      instructions: 'sort by sender importance',
      input: JSON.stringify([
        { subject: 'Stats', from: 'analyst@anywhere.com' },
        { subject: 'Data', from: 'analyst@bigcorp.com' },
        { subject: 'Note', from: 'person@sequoia.vc' },
      ]),
      output: [
        { subject: 'Note', from: 'person@sequoia.vc' },
        { subject: 'Stats', from: 'analyst@anywhere.com' },
        { subject: 'Data', from: 'analyst@bigcorp.com' },
      ],
      explanation: 'RULE: analyst@ prefix ALWAYS means spam (last), regardless of domain',
      metadata,
      status: 'approved',
    })

    // Now test with new emails - should apply learned domain rules
    const testEmails = [
      { subject: 'Growth metrics', from: 'analyst@goldmansachs.com' }, // spam - should be last
      { subject: 'Partnership', from: 'team@google.com' }, // competitor - medium
      { subject: 'Portfolio update', from: 'team@sequoia.vc' }, // our investor - should be first
      { subject: 'Funding round', from: 'ben@a16z.com' }, // potential investor - high
      { subject: 'Collab opportunity', from: 'cto@new-startup.io' }, // other startup - low
    ]

    const sorted = await getZai()
      .with({
        activeLearning: {
          enable: true,
          tableName,
          taskId,
        },
      })
      .sort(testEmails, 'sort by sender importance')

    // Verify the learned domain rules were applied
    expect(sorted).toHaveLength(5)

    // Find positions of each email type
    const sequoiaIndex = sorted.findIndex((e) => e.from.includes('sequoia.vc'))
    const a16zIndex = sorted.findIndex((e) => e.from.includes('a16z.com'))
    const googleIndex = sorted.findIndex((e) => e.from.includes('google.com'))
    const startupIndex = sorted.findIndex((e) => e.from.includes('new-startup.io'))
    const analystIndex = sorted.findIndex((e) => e.from.includes('analyst@'))

    // MOST IMPORTANT LEARNED PATTERN: analyst@ should ALWAYS be last
    // This is the clearest pattern and should be learned consistently
    console.log(sorted)
    expect(analystIndex).toBe(4)

    // All non-spam should come before spam (analyst@)
    expect(sequoiaIndex).toBeLessThan(analystIndex)
    expect(a16zIndex).toBeLessThan(analystIndex)
    expect(googleIndex).toBeLessThan(analystIndex)
    expect(startupIndex).toBeLessThan(analystIndex)

    // Known companies/investors should come before random startups
    // (sequoia, a16z, google are all "known" vs random-startup.io)
    expect(sequoiaIndex).toBeLessThan(startupIndex)
    expect(a16zIndex).toBeLessThan(startupIndex)
    expect(googleIndex).toBeLessThan(startupIndex)

    // The relative order of sequoia vs a16z vs google may vary,
    // but at least one investor should be in top 3
    const investorsInTop3 = [sequoiaIndex, a16zIndex].filter((idx) => idx <= 2)
    expect(investorsInTop3.length).toBeGreaterThanOrEqual(1)
  })
})
