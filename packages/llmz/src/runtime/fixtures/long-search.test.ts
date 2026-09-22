import { describe, expect, it } from 'vitest'
import { CitationsManager } from '../../chat/citations.js'
import { buildSearchChallenge, longSearchChallenges } from './long-search.js'

describe('search challenge citation expectations', () => {
  it.each(longSearchChallenges)('$id allows scope comparisons while requiring the answer evidence', (challenge) => {
    const fixture = buildSearchChallenge(challenge, false, new CitationsManager())
    const seed = challenge.size / 1000 + ['scope', 'revision', 'join', 'arithmetic'].indexOf(challenge.profile) * 79
    const contextual = [0, 1, 46, 47].map((index) => `operations-${seed}-${index}.md`)

    expect(fixture.relevantSources.sort()).toEqual([...fixture.expectedSources, ...contextual].sort())
    expect(fixture.expectedSources).toHaveLength(['join', 'arithmetic'].includes(challenge.profile) ? 2 : 1)
    expect(fixture.expectedSources.every((source) => !contextual.includes(source))).toBe(true)
    expect(fixture.relevantSources).not.toContain(`operations-${seed}-2.md`)
    for (const tag of fixture.evidenceTags) {
      expect(fixture.content).toContain(`<${tag} `)
    }

    const compact = buildSearchChallenge(challenge, true, new CitationsManager())
    expect(compact.expectedSources).toEqual(fixture.expectedSources)
    expect(compact.relevantSources.sort()).toEqual(fixture.relevantSources)
  })
})
