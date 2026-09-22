import { CitationsManager } from '../../chat/citations.js'

export type SearchChallenge = {
  id: string
  size: number
  profile: 'scope' | 'revision' | 'join' | 'arithmetic'
  language: string
  position: number
}
const profiles = ['scope', 'revision', 'join', 'arithmetic'] as const
const languages = ['English', 'French', 'Spanish', 'Japanese']
export const longSearchChallenges: SearchChallenge[] = [40_000, 100_000, 180_000].flatMap((size, level) =>
  profiles.map((profile, i) => ({
    id: `${size}/${profile}/${languages[(level + i) % languages.length]}`,
    size,
    profile,
    language: languages[(level + i) % languages.length]!,
    position: [0.18, 0.51, 0.84][level]!,
  }))
)

/** Synthetic VDK-shaped search results. No customer data or external search is involved. */
export function buildSearchChallenge(challenge: SearchChallenge, compact: boolean, citations: CitationsManager) {
  const seed = challenge.size / 1000 + profiles.indexOf(challenge.profile) * 79
  const code = `MICA-${seed * 37 + 629}`
  const limit = 734 + seed
  const used = 116 + (seed % 31)
  const held = 29 + (seed % 13)
  const remaining = limit - used - held
  const policy = `R-${seed + 417}-QN`
  const team = `Birch-${seed + 517}`
  const main = Math.round(47 * challenge.position)
  const second = main < 24 ? 39 : 7
  const required = challenge.profile === 'join' || challenge.profile === 'arithmetic' ? [main, second] : [main]
  const evidence = new Map<number, string>()
  let question: string
  let facts: string[]
  switch (challenge.profile) {
    case 'scope':
      question =
        'For Meridian release 5.4 Enterprise accounts in the EU, what is the export approval code and daily export limit?'
      evidence.set(
        main,
        `Policy applies exclusively to Meridian release 5.4, Enterprise plan, EU region. Export approval code: ${code}. Daily export limit: ${limit}. Release 5.3, Standard plans and US regions use different rules.`
      )
      facts = [code, String(limit)]
      break
    case 'revision':
      question =
        'As of 2031-04-12, what export approval code and daily limit apply to Meridian release 5.4 Enterprise in the EU?'
      evidence.set(
        main,
        `Revision 3 of the Meridian 5.4 Enterprise EU export policy took effect 2031-03-01 and supersedes revision 2. Approval code: ${code}. Daily limit: ${limit}. Revision 4 is scheduled for 2031-07-01 and must not be applied before that date.`
      )
      facts = [code, String(limit)]
      break
    case 'join':
      question = `Which export approval code and daily limit apply to team ${team}? Use its assigned policy, not the default, and cite both the assignment and policy.`
      evidence.set(
        main,
        `Team ${team} is assigned exclusively to policy ${policy}. The standard Meridian defaults do not apply to this team. This assignment has no expiry.`
      )
      evidence.set(
        second,
        `Policy ${policy}: export approval code ${code}; daily export limit ${limit}. This is an exception policy and only applies to teams explicitly assigned to it.`
      )
      facts = [code, String(limit)]
      break
    case 'arithmetic':
      question = `How many additional exports can team ${team} submit today? Both completed exports and pending reservations consume the daily quota. Cite the quota and usage sources.`
      evidence.set(
        main,
        `Team ${team} has a daily export quota of ${limit}. Pending export reservations count against the same quota as completed exports. Cancelled exports do not count.`
      )
      evidence.set(
        second,
        `Today's usage for team ${team}: ${used} completed exports; ${held} pending reserved exports; 83 cancelled exports. These are separate, non-overlapping categories. No other exports exist today.`
      )
      facts = [String(remaining)]
      break
  }

  const distractors = new Map<number, string>([
    [
      0,
      `Meridian release 5.4 Enterprise US export approval code MICA-99991 and daily limit 901. EU accounts are outside this record's scope.`,
    ],
    [
      1,
      `Revision 2: Meridian 5.4 Enterprise EU used approval code MICA-99992 and daily limit 902 until 2031-02-28. This historical record was superseded.`,
    ],
    [
      46,
      `Revision 4: Meridian 5.4 Enterprise EU will use MICA-99993 and daily limit 903 from 2031-07-01. Future policy; not effective in April.`,
    ],
    [
      47,
      `Team ${team}-archive follows policy R-${seed + 417}-QM with limit 904 and code MICA-99994. The similarly named active team is a different account.`,
    ],
  ])
  const paragraph = (doc: number, part: number) => {
    const n = (seed * 101 + doc * 47 + part * 13) % 997
    return `Operations record ${doc}-${part}, district ${['North', 'West', 'South', 'East'][n % 4]}. The ${['Aurora', 'Meridian', 'Juniper', 'Cobalt'][part % 4]} maintenance team reviewed batch ${n} for release ${2 + (n % 4)}.${n % 10}. This passage covers ${['retention windows', 'regional audit schedules', 'archived migration notes', 'warehouse transfer timing'][doc % 4]}, not current export authorization. It records ${90 + n} processed events and approval reference HIST-${n + 2100}. Similar product names do not establish matching region, subscription, version, or effective date.\n`
  }
  const docs = Array.from({ length: 48 }, (_, i) => {
    const core =
      evidence.get(i) ??
      distractors.get(i) ??
      `Historical operations note ${i}. No export policy for the requested account is established here.`
    let padding = ''
    if (!compact) {
      for (let j = 0; padding.length < challenge.size / 48; j++) {
        padding += paragraph(i, j)
      }
    }

    const midpoint = padding.indexOf('\n', Math.floor(padding.length / 2)) + 1
    return { id: i, text: padding.slice(0, midpoint) + core + '\n' + padding.slice(midpoint) }
  }).filter((doc) => !compact || evidence.has(doc.id) || distractors.has(doc.id))

  // Match VDK's example tag and per-passage source registration. The example is NOT evidence.
  const example = citations.registerSource({})
  const expectedSources: string[] = []
  const relevantSources: string[] = []
  const evidenceTags: string[] = []
  const rendered = docs
    .map((doc) => {
      const file = `operations-${seed}-${doc.id}.md`
      const title = `Operations bulletin ${seed}-${doc.id}`
      const citation = citations.registerSource({ file, title, url: `https://cedar.example/docs/${file}` })
      if (required.includes(doc.id)) {
        expectedSources.push(file)
        evidenceTags.push(citation.tag)
      }

      // Near matches can support scope/date comparisons, but do not replace required evidence.
      if (required.includes(doc.id) || distractors.has(doc.id)) {
        relevantSources.push(file)
      }

      return `<${citation.tag} file="${file}" title="${title}">\n${doc.text}\n</${citation.tag}>`
    })
    .join('\n')
  return {
    question,
    facts,
    expectedSources,
    relevantSources,
    evidenceTags,
    content: `Here are the search results from the knowledge base that might be relevant, formatted with citations:\n${rendered}`,
    reason: `We got the search results. When answering the question, you MUST add inline the citations used (eg: "The supported fact${example.tag} ..."). The example tag is illustrative; cite actual supporting passages only.`,
  }
}
