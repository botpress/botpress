import { describe, it, expect } from 'vitest'

import { Oct2024Prompt } from './oct-2024.js'

describe('October Prompt', { timeout: 60_000 }, () => {
  describe('parseAssistantResponse', () => {
    it('strips tsx code markers at the beginning', async () => {
      const input = `
\`\`\`tsx
■fn_start
// Start the onboarding capability as the user greeted with "Hi"
await startCapability({ capabilityId: "hello" })
return { action: 'listen' }
■fn_end
\`\`\`
`.trim()

      const response = Oct2024Prompt.parseAssistantResponse(input)

      if (response.type !== 'code') {
        throw 'Expected a code response'
      }

      expect(response.code).toMatchInlineSnapshot(`
        "// Start the onboarding capability as the user greeted with "Hi"
        await startCapability({ capabilityId: "hello" })
        return { action: 'listen' }"
      `)
    })

    it('strips tsx code markers inside fn_start', async () => {
      const input = `

■fn_start
\`\`\`tsx
// Start the onboarding capability as the user greeted with "Hi"
await startCapability({ capabilityId: "hello" })
return { action: 'listen' }
\`\`\`
■fn_end
`.trim()

      const response = Oct2024Prompt.parseAssistantResponse(input)

      if (response.type !== 'code') {
        throw 'Expected a code response'
      }

      expect(response.code).toMatchInlineSnapshot(`
        "// Start the onboarding capability as the user greeted with "Hi"
        await startCapability({ capabilityId: "hello" })
        return { action: 'listen' }"
      `)
    })

    it('missing fn_ blocks is OK', async () => {
      const input = `

\`\`\`tsx
// Start the onboarding capability as the user greeted with "Hi"
await startCapability({ capabilityId: "hello" })
return { action: 'listen' }
\`\`\`
`.trim()

      const response = Oct2024Prompt.parseAssistantResponse(input)

      if (response.type !== 'code') {
        throw 'Expected a code response'
      }

      expect(response.code).toMatchInlineSnapshot(`
        "// Start the onboarding capability as the user greeted with "Hi"
        await startCapability({ capabilityId: "hello" })
        return { action: 'listen' }"
      `)
    })

    it('no tsx code markers is OK', async () => {
      const input = `


// Start the onboarding capability as the user greeted with "Hi"
await startCapability({ capabilityId: "hello" })
return { action: 'listen' }

`.trim()

      const response = Oct2024Prompt.parseAssistantResponse(input)

      if (response.type !== 'code') {
        throw 'Expected a code response'
      }

      expect(response.code).toMatchInlineSnapshot(`
        "// Start the onboarding capability as the user greeted with "Hi"
        await startCapability({ capabilityId: "hello" })
        return { action: 'listen' }"
      `)
    })
  })
})
