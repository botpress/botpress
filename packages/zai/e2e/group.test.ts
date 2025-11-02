import { beforeEach, describe, expect, it } from 'vitest'
import type { Zai } from '../src'
import { getZai } from './utils'

describe('group', () => {
  let zai: Zai

  beforeEach(async () => {
    zai = await getZai()
  })

  describe('basic grouping', () => {
    it('should group simple strings by category', async () => {
      const items = ['apple', 'banana', 'carrot', 'broccoli', 'orange', 'spinach']

      const result = await zai.group(items, {
        instructions: 'Group these items into fruits and vegetables',
      })

      expect(Object.keys(result).length).toBeGreaterThanOrEqual(2)
      expect(Object.keys(result).length).toBeLessThanOrEqual(3) // fruits, vegetables, maybe ambiguous
    })

    it('should handle empty array', async () => {
      const items: string[] = []

      const result = await zai.group(items)

      expect(result).toEqual({})
    })

    it('should handle single element', async () => {
      const items = ['apple']

      const result = await zai.group(items, {
        instructions: 'Group by category',
      })

      expect(Object.keys(result).length).toBe(1)
      expect(Object.values(result).flat().length).toBe(1)
    })

    it('should group all items into single group when very similar', async () => {
      const items = ['apple', 'red apple', 'green apple', 'apple fruit']

      const result = await zai.group(items, {
        instructions: 'Group similar items',
      })

      // Should recognize these are all apples
      expect(Object.keys(result).length).toBeLessThanOrEqual(2)
    })
  })

  describe('complex object grouping', () => {
    it('should group objects by semantic similarity', async () => {
      const items = [
        { text: 'I love this product!', rating: 5 },
        { text: 'Terrible experience', rating: 1 },
        { text: 'Amazing quality', rating: 5 },
        { text: 'Worst purchase ever', rating: 1 },
        { text: 'Pretty good', rating: 4 },
        { text: 'Disappointed', rating: 2 },
      ]

      const result = await zai.group(items, {
        instructions: 'Group by sentiment (positive, negative, neutral)',
      })

      expect(Object.keys(result).length).toBeGreaterThanOrEqual(2) // At least positive and negative
      expect(Object.keys(result).length).toBeLessThanOrEqual(3) // At most positive, negative, neutral
    })

    it('should group by multiple criteria', async () => {
      const items = [
        { name: 'Alice', department: 'Engineering', level: 'Senior' },
        { name: 'Bob', department: 'Engineering', level: 'Junior' },
        { name: 'Carol', department: 'Sales', level: 'Senior' },
        { name: 'Dave', department: 'Sales', level: 'Junior' },
        { name: 'Eve', department: 'Engineering', level: 'Senior' },
      ]

      const result = await zai.group(items, {
        instructions: 'Group by department',
      })

      expect(Object.keys(result).length).toBe(2) // Engineering and Sales
      expect(Object.values(result).every((group) => group.length > 0)).toBe(true)
    })
  })

  describe('large arrays and chunking', () => {
    it('should handle large arrays (50+ elements)', async () => {
      const items = Array.from({ length: 100 }, (_, i) => {
        if (i % 3 === 0) return `fruit ${i}`
        if (i % 3 === 1) return `vegetable ${i}`
        return `grain ${i}`
      })

      const result = await zai.group(items, {
        instructions: 'Group by food category',
      })

      expect(Object.keys(result).length).toBe(3)
      expect(Object.values(result).flat().length).toBe(100)
    })

    it('should handle very long text elements', async () => {
      const items = [
        'A'.repeat(1000) + ' - this is about topic A',
        'B'.repeat(1000) + ' - this is about topic B',
        'A'.repeat(1000) + ' - also about topic A',
        'C'.repeat(1000) + ' - different topic C',
        'B'.repeat(1000) + ' - more on topic B',
      ]

      const result = await zai.group(items, {
        instructions: 'Group by topic',
        tokensPerElement: 100, // Truncate long elements
      })

      expect(Object.keys(result).length).toBeGreaterThanOrEqual(2)
      expect(Object.keys(result).length).toBeLessThanOrEqual(3)
    })

    it('should handle array that requires multiple group window slides', async () => {
      // Create enough items to require sliding groups window
      const items = Array.from({ length: 200 }, (_, i) => `item ${i % 10}`)

      const result = await zai.group(items, {
        instructions: 'Group identical or very similar items together',
      })

      // Should recognize patterns and group similar items
      expect(Object.keys(result).length).toBeLessThanOrEqual(15) // Should find patterns
      expect(Object.values(result).flat().length).toBe(200) // All items accounted for
    })
  })

  describe('initial groups', () => {
    it('should use initial groups as starting point', async () => {
      const items = ['apple', 'banana', 'carrot', 'orange', 'broccoli']

      const result = await zai.group(items, {
        instructions: 'Assign items to existing groups or create new ones',
        initialGroups: [
          { id: 'fruits', label: 'Fruits', elements: [] },
          { id: 'vegetables', label: 'Vegetables', elements: [] },
        ],
      })

      expect(Object.keys(result)).toContain('Fruits')
      expect(Object.keys(result)).toContain('Vegetables')
    })

    it('should create new groups when initial groups do not fit', async () => {
      const items = ['apple', 'banana', 'chicken', 'beef', 'carrot']

      const result = await zai.group(items, {
        instructions: 'Assign to existing groups or create new ones',
        initialGroups: [{ id: 'fruits', label: 'Fruits', elements: [] }],
      })

      // Should create new groups for meat and vegetables
      expect(Object.keys(result).length).toBeGreaterThan(1)
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle items with null/undefined values', async () => {
      const items = ['apple', null, 'banana', undefined, 'carrot'] as any[]

      const result = await zai.group(items, {
        instructions: 'Group by type',
      })

      expect(Object.values(result).flat().length).toBeLessThanOrEqual(5)
    })

    it('should handle duplicate items', async () => {
      const items = ['apple', 'apple', 'apple', 'banana', 'banana']

      const result = await zai.group(items, {
        instructions: 'Group identical items',
      })

      expect(Object.keys(result).length).toBeLessThanOrEqual(2)
      // All apples should be together
      const appleGroup = Object.values(result).find((group) => group.includes('apple'))
      expect(appleGroup?.filter((item) => item === 'apple').length).toBe(3)
    })

    it('should handle mixed types in array', async () => {
      const items = ['string', 123, { key: 'value' }, ['array'], true, null] as any[]

      const result = await zai.group(items, {
        instructions: 'Group by data type',
      })

      expect(Object.keys(result).length).toBeGreaterThanOrEqual(2)
    })

    it('should respect token limits per element', async () => {
      const items = [
        'Short text',
        'A'.repeat(10000), // Very long
        'Another short',
      ]

      const result = await zai.group(items, {
        tokensPerElement: 50, // Limit tokens per element
      })

      expect(Object.values(result).flat().length).toBe(3)
    })
  })

  describe('result format', () => {
    it('should return detailed result format with .result()', async () => {
      const items = ['apple', 'banana', 'carrot']
      const response = zai.group(items, {
        instructions: 'Group by food type',
      })

      const { output, usage, elapsed } = await response.result()

      expect(output).toBeInstanceOf(Array)
      expect(output.length).toBeGreaterThan(0)

      // Check group structure
      output.forEach((group) => {
        expect(group).toHaveProperty('id')
        expect(group).toHaveProperty('label')
        expect(group).toHaveProperty('elements')
        expect(Array.isArray(group.elements)).toBe(true)
        expect(typeof group.id).toBe('string')
        expect(typeof group.label).toBe('string')
      })

      expect(elapsed).toBeGreaterThan(0)
    })

    it('should return simplified format on await', async () => {
      const items = ['apple', 'banana', 'carrot']
      const result = await zai.group(items, {
        instructions: 'Group by food type',
      })

      // Simplified format: Record<string, T[]>
      expect(typeof result).toBe('object')
      expect(Array.isArray(result)).toBe(false)

      Object.entries(result).forEach(([label, elements]) => {
        expect(typeof label).toBe('string')
        expect(Array.isArray(elements)).toBe(true)
      })
    })
  })

  describe('performance and concurrency', () => {
    it('should process large arrays efficiently with parallel chunks', async () => {
      const items = Array.from({ length: 500 }, (_, i) => `item ${i % 25}`)

      const start = Date.now()
      const result = await zai.group(items, {
        instructions: 'Group similar items',
      })
      const elapsed = Date.now() - start

      expect(Object.values(result).flat().length).toBe(500)
      // Should complete in reasonable time (parallel processing)
      expect(elapsed).toBeLessThan(120000) // 2 minutes max
    })
  })

  describe('refinement and pruning', () => {
    it('should handle elements that could belong to multiple groups', async () => {
      const items = [
        'tomato', // Could be fruit or vegetable
        'apple',
        'carrot',
        'avocado', // Could be fruit or vegetable
        'banana',
      ]

      const result = await zai.group(items, {
        instructions: 'Group into fruits or vegetables (make best judgment for ambiguous items)',
      })

      // Each item should belong to exactly one group
      const allItems = Object.values(result).flat()
      expect(allItems.length).toBe(items.length)

      // Check for duplicates (shouldn't happen after pruning)
      const uniqueItems = new Set(allItems)
      expect(uniqueItems.size).toBe(items.length)
    })
  })

  describe('active learning', () => {
    it('should support active learning with task id', async () => {
      const items = ['apple', 'banana', 'carrot', 'broccoli']

      const zaiWithLearning = zai.learn('group-food-categories')

      const result = await zaiWithLearning.group(items, {
        instructions: 'Group into fruits and vegetables',
      })

      expect(Object.keys(result).length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('no instructions provided', () => {
    it('should group by natural similarity without instructions', async () => {
      const items = ['cat', 'dog', 'lion', 'tiger', 'parrot', 'eagle']

      const result = await zai.group(items)

      // Should naturally group by animal type (pets, wild cats, birds)
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(2)
      expect(Object.keys(result).length).toBeLessThanOrEqual(4)
    })
  })

  describe('date-based grouping with window slides', () => {
    it('should group 1000 large elements by date with window sliding', async () => {
      // Generate dates (500 dates = 1000 elements / 2 elements per date)
      const startDate = new Date('2024-01-01').getTime()
      const dates: string[] = []

      for (let i = 0; i < 500; i++) {
        const date = new Date(startDate + i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD format
        dates.push(dateStr)
      }

      // Create 2 elements per date (A and B), each with large padding text
      const items: Array<{ id: string; date: string; content: string }> = []

      dates.forEach((date) => {
        // Element A - large content about morning
        items.push({
          id: `${date}-A`,
          date,
          content: `
            Date: ${date}
            Type: A (Morning Entry)
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            Morning activities: breakfast, exercise, reading news, checking emails, planning the day ahead.
            Weather: sunny and bright. Temperature: comfortable. Mood: energetic and ready to tackle challenges.
            Additional notes about the morning routine and various observations throughout the early hours.
            Multiple paragraphs of content to ensure each element is sufficiently large for token budget testing.
            This helps simulate real-world scenarios where elements contain substantial information.
          `.trim(),
        })

        // Element B - large content about evening
        items.push({
          id: `${date}-B`,
          date,
          content: `
            Date: ${date}
            Type: B (Evening Entry)
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.
            Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.
            Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
            Evening activities: dinner preparation, family time, watching shows, journaling, reflecting on the day's events.
            Weather: cooling down as night approaches. Temperature: pleasant. Mood: relaxed and contemplative.
            Additional reflections about the evening routine and observations from the later hours of the day.
            Multiple paragraphs of evening content to match the morning entry size and ensure consistent token usage.
            This creates a balanced dataset for comprehensive grouping algorithm testing.
          `.trim(),
        })
      })

      // Seeded random for consistent test results
      let seed = 12345
      const seededRandom = () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
      }

      // Shuffle the array to make grouping more challenging (with seed for deterministic results)
      const shuffled = items.sort(() => seededRandom() - 0.5)

      const result = await zai.group(shuffled, {
        instructions: 'Group by date field (YYYY-MM-DD). Each date should have its own group.',
        tokensPerElement: 300, // Allow sufficient tokens for the large content
        chunkLength: 8000, // Smaller chunks to force window sliding
      })

      // Should have exactly 500 groups (one per date)
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(450) // Allow some margin
      expect(Object.keys(result).length).toBeLessThanOrEqual(550)

      // Each group should have exactly 2 elements (A and B)
      const groupSizes = Object.values(result).map((group) => group.length)
      const averageGroupSize = groupSizes.reduce((a, b) => a + b, 0) / groupSizes.length

      // Average should be close to 2
      expect(averageGroupSize).toBeGreaterThan(1.8)
      expect(averageGroupSize).toBeLessThan(2.2)

      // Verify all 1000 elements are accounted for
      const totalElements = Object.values(result).flat().length
      expect(totalElements).toBe(1000)

      // Verify no element appears in multiple groups (proper pruning)
      const allElements = Object.values(result).flat()
      const uniqueIds = new Set(allElements.map((el) => el.id))
      expect(uniqueIds.size).toBe(1000)

      // Sample check: verify a few random dates have both A and B elements
      const sampleDate = dates[100] // Check date at index 100
      const groupForSampleDate = Object.entries(result).find(([_label, elements]) =>
        elements.some((el) => el.date === sampleDate)
      )

      if (groupForSampleDate) {
        const [_label, elements] = groupForSampleDate
        const idsForSampleDate = elements.filter((el) => el.date === sampleDate).map((el) => el.id)

        // Should contain both A and B for this date
        expect(idsForSampleDate.some((id) => id.includes('-A'))).toBe(true)
        expect(idsForSampleDate.some((id) => id.includes('-B'))).toBe(true)
      }
    }, 180000) // 3 minute timeout for this large test
  })

  describe('multi-criteria complex grouping', () => {
    it('should group by multiple elaborate criteria considering multiple properties', async () => {
      // Create a dataset of customer transactions with multiple properties
      const transactions = [
        // High-value, urgent, technical products - VIP customers
        {
          id: 'txn-001',
          customer: 'Alice Corp',
          amount: 15000,
          priority: 'urgent',
          category: 'software',
          region: 'NA',
          renewalStatus: 'expiring-soon',
        },
        {
          id: 'txn-002',
          customer: 'Bob Industries',
          amount: 22000,
          priority: 'urgent',
          category: 'hardware',
          region: 'NA',
          renewalStatus: 'active',
        },
        {
          id: 'txn-003',
          customer: 'Charlie LLC',
          amount: 18000,
          priority: 'high',
          category: 'software',
          region: 'EU',
          renewalStatus: 'expiring-soon',
        },

        // High-value but standard priority - Key accounts
        {
          id: 'txn-004',
          customer: 'Delta Systems',
          amount: 12000,
          priority: 'standard',
          category: 'consulting',
          region: 'APAC',
          renewalStatus: 'active',
        },
        {
          id: 'txn-005',
          customer: 'Echo Partners',
          amount: 14000,
          priority: 'standard',
          category: 'software',
          region: 'NA',
          renewalStatus: 'active',
        },
        {
          id: 'txn-006',
          customer: 'Foxtrot Ltd',
          amount: 16000,
          priority: 'standard',
          category: 'hardware',
          region: 'EU',
          renewalStatus: 'new',
        },

        // Low-value but urgent - Small urgent matters
        {
          id: 'txn-007',
          customer: 'Golf Inc',
          amount: 800,
          priority: 'urgent',
          category: 'support',
          region: 'NA',
          renewalStatus: 'active',
        },
        {
          id: 'txn-008',
          customer: 'Hotel Co',
          amount: 1200,
          priority: 'urgent',
          category: 'maintenance',
          region: 'EU',
          renewalStatus: 'expiring-soon',
        },
        {
          id: 'txn-009',
          customer: 'India Tech',
          amount: 950,
          priority: 'urgent',
          category: 'support',
          region: 'APAC',
          renewalStatus: 'active',
        },

        // Expiring renewals regardless of amount - Retention focus
        {
          id: 'txn-010',
          customer: 'Juliet Ventures',
          amount: 5000,
          priority: 'standard',
          category: 'software',
          region: 'NA',
          renewalStatus: 'expiring-soon',
        },
        {
          id: 'txn-011',
          customer: 'Kilo Systems',
          amount: 3500,
          priority: 'low',
          category: 'hardware',
          region: 'EU',
          renewalStatus: 'expiring-soon',
        },
        {
          id: 'txn-012',
          customer: 'Lima Corp',
          amount: 7800,
          priority: 'high',
          category: 'consulting',
          region: 'APAC',
          renewalStatus: 'expiring-soon',
        },

        // New customers - Onboarding focus
        {
          id: 'txn-013',
          customer: 'Mike Industries',
          amount: 4500,
          priority: 'standard',
          category: 'software',
          region: 'NA',
          renewalStatus: 'new',
        },
        {
          id: 'txn-014',
          customer: 'November Ltd',
          amount: 6200,
          priority: 'standard',
          category: 'consulting',
          region: 'EU',
          renewalStatus: 'new',
        },
        {
          id: 'txn-015',
          customer: 'Oscar Partners',
          amount: 3900,
          priority: 'low',
          category: 'hardware',
          region: 'APAC',
          renewalStatus: 'new',
        },

        // Regional concentrations - APAC expansion
        {
          id: 'txn-016',
          customer: 'Papa Tech',
          amount: 2500,
          priority: 'standard',
          category: 'software',
          region: 'APAC',
          renewalStatus: 'active',
        },
        {
          id: 'txn-017',
          customer: 'Quebec Co',
          amount: 3100,
          priority: 'standard',
          category: 'hardware',
          region: 'APAC',
          renewalStatus: 'active',
        },
        {
          id: 'txn-018',
          customer: 'Romeo Systems',
          amount: 2800,
          priority: 'low',
          category: 'support',
          region: 'APAC',
          renewalStatus: 'active',
        },

        // Low-value, low-priority - Standard processing
        {
          id: 'txn-019',
          customer: 'Sierra Inc',
          amount: 600,
          priority: 'low',
          category: 'maintenance',
          region: 'NA',
          renewalStatus: 'active',
        },
        {
          id: 'txn-020',
          customer: 'Tango Ltd',
          amount: 750,
          priority: 'low',
          category: 'support',
          region: 'EU',
          renewalStatus: 'active',
        },
        {
          id: 'txn-021',
          customer: 'Uniform Corp',
          amount: 550,
          priority: 'low',
          category: 'maintenance',
          region: 'NA',
          renewalStatus: 'active',
        },

        // Consulting services - Strategic projects
        {
          id: 'txn-022',
          customer: 'Victor Consulting',
          amount: 9500,
          priority: 'high',
          category: 'consulting',
          region: 'NA',
          renewalStatus: 'active',
        },
        {
          id: 'txn-023',
          customer: 'Whiskey Advisory',
          amount: 11000,
          priority: 'high',
          category: 'consulting',
          region: 'EU',
          renewalStatus: 'new',
        },
        {
          id: 'txn-024',
          customer: 'Xray Partners',
          amount: 8700,
          priority: 'standard',
          category: 'consulting',
          region: 'APAC',
          renewalStatus: 'active',
        },

        // Edge cases - mixed signals
        {
          id: 'txn-025',
          customer: 'Yankee Mixed',
          amount: 10500,
          priority: 'low',
          category: 'software',
          region: 'NA',
          renewalStatus: 'active',
        }, // High value but low priority
        {
          id: 'txn-026',
          customer: 'Zulu Odd',
          amount: 500,
          priority: 'high',
          category: 'consulting',
          region: 'EU',
          renewalStatus: 'new',
        }, // Low value but high priority
        {
          id: 'txn-027',
          customer: 'Alpha Edge',
          amount: 15000,
          priority: 'urgent',
          category: 'maintenance',
          region: 'APAC',
          renewalStatus: 'expiring-soon',
        }, // High value maintenance
      ]

      const complexInstructions = `
Group these business transactions into strategic cohorts based on the following elaborate multi-criteria framework:

**Priority Framework (combine these factors):**

1. **VIP Urgent Track**:
   - Transactions with amount > $10,000 AND priority = 'urgent'
   - OR amount > $15,000 AND (priority = 'high' OR priority = 'urgent')
   - These need immediate executive attention

2. **Retention Critical**:
   - Any transaction with renewalStatus = 'expiring-soon'
   - Especially if amount > $3,000 OR priority != 'low'
   - Customer retention is key priority

3. **New Customer Onboarding**:
   - renewalStatus = 'new'
   - If amount > $5,000, this is "Strategic Onboarding"
   - If amount <= $5,000, this is "Standard Onboarding"

4. **Regional Growth Focus**:
   - Region = 'APAC' with amount > $2,000
   - OR region = 'APAC' with category = 'software' or 'consulting'
   - Supporting regional expansion initiative

5. **Strategic Consulting**:
   - category = 'consulting' with amount > $8,000
   - OR category = 'consulting' with priority = 'high'
   - High-value strategic engagements

6. **Small Urgent Matters**:
   - priority = 'urgent' with amount < $2,000
   - Quick wins for urgent but low-value items

7. **Standard Processing Queue**:
   - Everything else that doesn't fit the above criteria
   - Normal business flow

**Important**: A transaction should be assigned to the MOST SPECIFIC group it qualifies for.
For example, if a transaction qualifies for both "VIP Urgent Track" and "Retention Critical",
choose "VIP Urgent Track" as it's more urgent. Use business judgment for priority.
      `.trim()

      const result = await zai.group(transactions, {
        instructions: complexInstructions,
        tokensPerElement: 150,
      })

      // Should have multiple strategic groups
      const groupLabels = Object.keys(result)
      expect(groupLabels.length).toBeGreaterThanOrEqual(5) // At least 5 different strategic groups
      expect(groupLabels.length).toBeLessThanOrEqual(10) // Not too many groups

      // All transactions should be accounted for
      const totalElements = Object.values(result).flat().length
      expect(totalElements).toBe(27)

      // Verify no duplicates (proper pruning with complex criteria)
      const allIds = Object.values(result)
        .flat()
        .map((txn) => txn.id)
      const uniqueIds = new Set(allIds)
      expect(uniqueIds.size).toBe(27)

      // Verify specific expected groupings based on criteria

      // VIP Urgent Track should include high-value urgent items
      const vipUrgentGroup = Object.entries(result).find(
        ([label]) =>
          label.toLowerCase().includes('vip') ||
          (label.toLowerCase().includes('urgent') && label.toLowerCase().includes('track'))
      )
      if (vipUrgentGroup) {
        const [, elements] = vipUrgentGroup
        // Should contain txn-001, txn-002 (high value + urgent)
        const hasHighValueUrgent = elements.some((txn) => txn.amount > 10000 && txn.priority === 'urgent')
        expect(hasHighValueUrgent).toBe(true)
      }

      // Retention Critical should include expiring-soon items
      const retentionGroup = Object.entries(result).find(
        ([label]) =>
          label.toLowerCase().includes('retention') ||
          label.toLowerCase().includes('expiring') ||
          label.toLowerCase().includes('renewal')
      )
      if (retentionGroup) {
        const [, elements] = retentionGroup
        const hasExpiringSoon = elements.some((txn) => txn.renewalStatus === 'expiring-soon')
        expect(hasExpiringSoon).toBe(true)
      }

      // New Customer groups should exist
      const onboardingGroups = Object.entries(result).filter(
        ([label]) => label.toLowerCase().includes('onboarding') || label.toLowerCase().includes('new customer')
      )
      const totalOnboarding = onboardingGroups.reduce((sum, [, elements]) => sum + elements.length, 0)

      // Should have several new customer transactions
      expect(totalOnboarding).toBeGreaterThanOrEqual(3)

      // APAC regional focus should be grouped
      const apacGroup = Object.entries(result).find(
        ([label]) =>
          label.toLowerCase().includes('apac') ||
          label.toLowerCase().includes('regional') ||
          label.toLowerCase().includes('asia')
      )
      if (apacGroup) {
        const [, elements] = apacGroup
        const allApac = elements.every((txn) => txn.region === 'APAC')
        // Should be heavily APAC-focused (allow some mixed grouping)
        const apacPercentage = elements.filter((txn) => txn.region === 'APAC').length / elements.length
        expect(apacPercentage).toBeGreaterThan(0.6) // At least 60% APAC
      }

      // Strategic consulting should be grouped
      const consultingGroup = Object.entries(result).find(
        ([label]) => label.toLowerCase().includes('consulting') || label.toLowerCase().includes('strategic')
      )
      if (consultingGroup) {
        const [, elements] = consultingGroup
        const hasHighValueConsulting = elements.some(
          (txn) => txn.category === 'consulting' && (txn.amount > 8000 || txn.priority === 'high')
        )
        expect(hasHighValueConsulting).toBe(true)
      }

      // Verify that high-value, low-priority edge case (txn-025) is handled reasonably
      const txn025 = Object.values(result)
        .flat()
        .find((txn) => txn.id === 'txn-025')
      expect(txn025).toBeDefined()

      // Verify complex edge case (txn-027: high value + urgent + maintenance + expiring)
      const txn027 = Object.values(result)
        .flat()
        .find((txn) => txn.id === 'txn-027')
      expect(txn027).toBeDefined()

      // This should be in VIP or Retention (both high priority groups)
      const txn027Group = Object.entries(result).find(([, elements]) =>
        elements.some((txn) => txn.id === 'txn-027')
      )?.[0]

      expect(txn027Group?.toLowerCase()).toMatch(/vip|urgent|retention|critical|expiring/)

      console.log('\n=== Group Distribution ===')
      Object.entries(result).forEach(([label, elements]) => {
        console.log(`${label}: ${elements.length} transactions`)
        console.log(`  IDs: ${elements.map((t) => t.id).join(', ')}`)
      })
    }, 120000) // 2 minute timeout
  })
})
