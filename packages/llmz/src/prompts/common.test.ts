import { describe, it, expect } from 'vitest'

import { parseAssistantResponse, replacePlaceholders } from './common.js'

describe('message-stream prompt', { timeout: 60_000 }, () => {
  describe('parseAssistantResponse', () => {
    it('parses sends, run and next blocks', async () => {
      const input = `
■send=md
Let me check that for you.
■run
// Fetch the user data
const data = await fetchUserData({ id: 'usr_1' })
return data
`.trim()

      const response = parseAssistantResponse(input)

      expect(response.sends).toEqual([{ name: 'md', props: {}, body: 'Let me check that for you.' }])
      expect(response.code).toMatchInlineSnapshot(`
        "// Fetch the user data
        const data = await fetchUserData({ id: 'usr_1' })
        return data"
      `)
      expect(response.next).toBeUndefined()
    })

    it('parses a next exit with props', async () => {
      const response = parseAssistantResponse(
        '■send=md\nTransferring you now!\n■next=book_meeting { reason: "demo", email: "a@b.com" }'
      )

      expect(response.code).toBeUndefined()
      expect(response.next).toEqual({ name: 'book_meeting', props: { reason: 'demo', email: 'a@b.com' } })
    })

    it('strips code fences wrapping the whole response', async () => {
      const input = `
\`\`\`
■send=md
Hello!
■next=listen
\`\`\`
`.trim()

      const response = parseAssistantResponse(input)

      expect(response.sends).toEqual([{ name: 'md', props: {}, body: 'Hello!' }])
      expect(response.next).toEqual({ name: 'listen', props: {} })
    })

    it('recovers plain text into an implicit send', async () => {
      const response = parseAssistantResponse('Hello! How can I help you today?')

      expect(response.sends).toEqual([{ name: 'md', props: {}, body: 'Hello! How can I help you today?' }])
      expect(response.code).toBeUndefined()
      expect(response.next).toBeUndefined()
    })

    it('keeps code fences inside message bodies', async () => {
      const input = '■send=md\nHere is an example:\n```js\nconsole.log(1)\n```\n■next=listen'

      const response = parseAssistantResponse(input)

      expect(response.sends[0]!.body).toBe('Here is an example:\n```js\nconsole.log(1)\n```')
    })

    it('parses multiple sends in order', async () => {
      const response = parseAssistantResponse(
        '■send=md\nPick an option:\n■send=buttons { buttons: [{ label: "A" }, { label: "B" }] }\n■next=listen'
      )

      expect(response.sends.map((s) => s.name)).toEqual(['md', 'buttons'])
      expect(response.sends[1]!.props).toEqual({ buttons: [{ label: 'A' }, { label: 'B' }] })
      expect(response.next).toEqual({ name: 'listen', props: {} })
    })
  })

  describe('replacePlaceholders - Handlebars injection security', () => {
    // Template that simulates the real system prompt structure
    const templateWithExits = `
Instructions: ■■■identity■■■

Available exits:
{{#each exits}}
- {{name}}: {{description}}
{{/each}}
`

    it('should NOT allow user input to access exits array via Handlebars injection', () => {
      // Attack: User tries to iterate over exits to extract exit names/descriptions
      const maliciousInstructions = `{{#each exits}}LEAKED: {{name}} - {{description}}{{/each}}`

      const result = replacePlaceholders(templateWithExits, {
        identity: maliciousInstructions,
        exits: [
          { name: 'secret_exit', description: 'This is a secret exit with sensitive info' },
          { name: 'admin_exit', description: 'Admin-only exit with password: hunter2' },
        ],
      })

      expect(result).toMatchInlineSnapshot(`
        "Instructions: {{#each exits}}LEAKED: {{name}} - {{description}}{{/each}}

        Available exits:
        - secret_exit: This is a secret exit with sensitive info
        - admin_exit: Admin-only exit with password: hunter2"
      `)
    })

    it('should safely handle nested Handlebars-like syntax in user messages', () => {
      // User legitimately wants to talk about Handlebars syntax
      const legitimateContent = `Here is an example of Handlebars:
{{#each items}}
  <li>{{name}}</li>
{{/each}}`

      const result = replacePlaceholders(templateWithExits, {
        identity: legitimateContent,
        exits: [{ name: 'items', description: 'not leaked' }],
      })

      // The user's example code should appear as-is (escaped or literal)
      // and should NOT iterate over the actual 'items' exit
      expect(result).not.toContain('<li>items</li>')
    })
  })
})
