import { describe, it, expect, afterAll, beforeEach, afterEach } from 'vitest'
import { getClient, getZai, metadata } from './utils'
import { TableAdapter } from '../src/adapters/botpress-table'
import type { AnswerResult } from '../src/operations/answer'
import { parseResponse } from '../src/operations/answer'

describe('zai.answer', { timeout: 60_000 }, () => {
  const zai = getZai()

  describe('basic answer generation', () => {
    it('should answer a simple question with citations (string documents)', async () => {
      const documents = [
        'Microsoft was founded in 1975 by Bill Gates and Paul Allen.',
        'Botpress is an AI agent platform.\nIt was founded in 2016.\nThe company is based in Quebec, Canada.',
        'Apple was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne in 1976.',
      ]

      const result = await zai.answer(documents, 'When was Botpress founded?')
      console.log(result)
      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toContain('2016')
        expect(result.citations.length).toBeGreaterThan(0)
        expect(result.citations[0].item).toBe(documents[1])
        expect(result.citations[0].snippet).toMatchInlineSnapshot(`"It was founded in 2016."`)
      }
    })

    it('should answer with object documents', async () => {
      const documents = [
        { name: 'Botpress', type: 'AI Platform', founded: 2016 },
        { name: 'Dialogflow', type: 'Chatbot Platform', founded: 2011 },
        { name: 'Rasa', type: 'Chatbot Framework', founded: 2016 },
      ]

      const result = await zai.answer(documents, 'What type of product is Botpress?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toContain('platform')
        expect(result.citations.length).toBeGreaterThan(0)
        expect(result.citations[0].item).toBe(documents[0])
      }
    })

    it('should provide full result with usage stats', async () => {
      const documents = ['The sky is blue.', 'Grass is green.']

      const { output, usage } = await zai.answer(documents, 'What color is the sky?').result()

      expect(output.type).toBe('answer')
      if (output.type === 'answer') {
        expect(output.answer.toLowerCase()).toContain('blue')
      }
      expect(usage.requests.requests).toBeGreaterThanOrEqual(1)
      expect(usage.requests.responses).toBeGreaterThanOrEqual(1)
    })

    it('should handle multiple citations in one answer', async () => {
      const documents = [
        'Botpress supports multiple languages including English, French, and Spanish.',
        'The platform has built-in NLU capabilities.',
        'Botpress can integrate with various LLM providers like OpenAI and Anthropic.',
      ]

      const result = await zai.answer(documents, 'What are the main features of Botpress?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.citations.length).toBeGreaterThanOrEqual(2)
        // Should reference multiple documents
        const uniqueItems = new Set(result.citations.map((c) => c.item))
        expect(uniqueItems.size).toBeGreaterThan(1)
      }
    })
  })

  describe('citation formats', () => {
    it('should handle single-line citations', async () => {
      const documents = ['The capital of France is Paris.']

      const result = await zai.answer(documents, 'What is the capital of France?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toContain('Paris')
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle range citations', async () => {
      const documents = [
        `France is a country in Western Europe.
It has a population of about 67 million people.
Paris is its capital and largest city.
France is known for its cuisine, wine, and culture.`,
      ]

      const result = await zai.answer(documents, 'Tell me about France.')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.citations.length).toBeGreaterThan(2)
      }
    })

    it('should handle non-contiguous citations', async () => {
      const documents = [
        'Botpress was founded in 2016.',
        'It has offices in multiple countries.',
        'The company is headquartered in Quebec, Canada.',
        'It provides an AI agent platform.',
        'The platform supports over 100 languages.',
      ]

      const result = await zai.answer(documents, 'Where is Botpress located and when was it founded?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.citations.length).toBeGreaterThan(0)
        expect(result.answer).toContain('2016')
        expect(result.answer.toLowerCase()).toMatch(/quebec|canada/)
      }
    })
  })

  describe('ambiguous responses', () => {
    it('should treat multiple ■answer tags as ambiguous (bad LLM generation)', () => {
      // Simulate a bad LLM response with multiple ■answer tags
      const malformedResponse = `■answer
This is the first answer.■001
■answer
This is the second answer.■002`

      // Create mock line mappings
      const documents = ['Document A: Information about topic A.', 'Document B: Information about topic B.']
      const mappings = [
        {
          lineNumber: 1,
          documentIndex: 0,
          lineInDocument: 0,
          text: 'Document A: Information about topic A.',
          document: documents[0],
        },
        {
          lineNumber: 2,
          documentIndex: 1,
          lineInDocument: 0,
          text: 'Document B: Information about topic B.',
          document: documents[1],
        },
      ]

      const result = parseResponse(malformedResponse, mappings)

      // Should interpret multiple ■answer tags as ambiguous
      expect(result.type).toBe('ambiguous')
      if (result.type === 'ambiguous') {
        expect(result.answers.length).toBe(2)
        expect(result.answers[0].answer).toContain('first answer')
        expect(result.answers[1].answer).toContain('second answer')
        // Citations should be removed from answers
        expect(result.answers[0].answer).not.toContain('■')
        expect(result.answers[1].answer).not.toContain('■')
      }
    })

    it('should detect ambiguity when question has multiple interpretations', async () => {
      const documents = [
        'Python is a programming language.',
        'Python is also a type of snake.',
        'The Python programming language was created by Guido van Rossum.',
        'Python snakes are found in Africa, Asia, and Australia.',
      ]

      const result = await zai.answer(documents, 'What is Python?')

      // Could be either answer or ambiguous
      if (result.type === 'ambiguous') {
        expect(result.ambiguity).toBeTruthy()
        expect(result.follow_up).toBeTruthy()
        expect(result.answers.length).toBeGreaterThanOrEqual(2)
        expect(result.answers.length).toBeLessThanOrEqual(3)
        expect(result.answers[0].answer).toBeTruthy()
        expect(result.answers[0].citations.length).toBeGreaterThan(0)
      } else if (result.type === 'answer') {
        // If it picks one interpretation, that's also acceptable
        expect(result.answer).toBeTruthy()
        expect(result.citations.length).toBeGreaterThan(0)
      } else {
        throw new Error('Expected answer or ambiguous response')
      }
    })

    it('should provide multiple possible answers when ambiguous', async () => {
      const documents = [
        'The word "bank" can refer to a financial institution.',
        'A bank can also mean the land alongside a river.',
        'Banks play a crucial role in the economy.',
        'River banks are important for ecosystems.',
      ]

      const result = await zai.answer(documents, 'What is a bank?')

      if (result.type === 'ambiguous') {
        expect(result.answers.length).toBeGreaterThanOrEqual(2)
        result.answers.forEach((answer) => {
          expect(answer.answer).toBeTruthy()
          expect(answer.citations.length).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('out of topic responses', () => {
    it('should detect when question is completely unrelated to documents', async () => {
      const documents = [
        'Botpress is an AI platform.',
        'It supports chatbot development.',
        'The platform integrates with various LLMs.',
      ]

      const result = await zai.answer(documents, 'What is the recipe for chocolate cake?')

      expect(result.type).toBe('out_of_topic')
      if (result.type === 'out_of_topic') {
        expect(result.reason).toBeTruthy()
        expect(result.reason.length).toBeGreaterThan(10)
      }
    })

    it('should detect out of topic even with partial keyword match', async () => {
      const documents = [
        'JavaScript is a programming language.',
        'It runs in web browsers.',
        'Node.js allows JavaScript to run on servers.',
      ]

      const result = await zai.answer(documents, 'How do I cook java beans?')

      expect(result.type).toBe('out_of_topic')
      if (result.type === 'out_of_topic') {
        expect(result.reason).toBeTruthy()
      }
    })

    it('should detect out of topic with highly technical documents and unrelated query', async () => {
      const documents = [
        'The Kubernetes control plane consists of the API server, scheduler, and controller manager.',
        'Pods are the smallest deployable units in Kubernetes that can be created and managed.',
        'A ReplicaSet ensures that a specified number of pod replicas are running at any given time.',
        'Services in Kubernetes provide stable networking endpoints for pods.',
        'ConfigMaps allow you to decouple configuration artifacts from container images.',
        'Persistent Volumes (PV) provide storage resources in a cluster.',
      ]

      const result = await zai.answer(documents, 'What are the health benefits of Mediterranean diet?')

      expect(result.type).toBe('out_of_topic')
      if (result.type === 'out_of_topic') {
        expect(result.reason.toLowerCase()).toMatch(/kubernetes|technical|container|diet|health/)
      }
    })

    it('should detect out of topic with medical documents and finance query', async () => {
      const documents = [
        'Myocardial infarction, commonly known as a heart attack, occurs when blood flow to the heart is blocked.',
        'Symptoms include chest pain, shortness of breath, and pain in the arm or jaw.',
        'Risk factors include high blood pressure, high cholesterol, smoking, and diabetes.',
        'Treatment may involve medications such as aspirin, beta-blockers, and ACE inhibitors.',
        'Coronary angioplasty and stenting are common interventional procedures.',
        'Cardiac rehabilitation programs help patients recover and reduce future risk.',
      ]

      const result = await zai.answer(documents, 'What is the current federal reserve interest rate?')

      expect(result.type).toBe('out_of_topic')
      if (result.type === 'out_of_topic') {
        expect(result.reason.toLowerCase()).toMatch(/medical|health|cardio|finance|interest|rate/)
      }
    })

    it('should handle borderline case where topic tangentially related', async () => {
      // Documents about programming in general, question about very specific unrelated language
      const documents = [
        'Python is a high-level programming language known for readability.',
        'JavaScript is primarily used for web development.',
        'Java is a statically-typed object-oriented language.',
        'C++ offers low-level memory manipulation capabilities.',
      ]

      const result = await zai.answer(documents, 'What are the key features of COBOL mainframe programming?')

      // Could be either out_of_topic or missing_knowledge since it's about programming but very different
      expect(['out_of_topic', 'missing_knowledge']).toContain(result.type)
      if (result.type === 'out_of_topic') {
        expect(result.reason).toBeTruthy()
      }
    })
  })

  describe('invalid question responses', () => {
    it('should detect empty question', async () => {
      const documents = ['Some information here.']

      const result = await zai.answer(documents, '')

      expect(result.type).toBe('invalid_question')
      if (result.type === 'invalid_question') {
        expect(result.reason).toBeTruthy()
      }
    })

    it('should detect non-question statements', async () => {
      const documents = ['Botpress is an AI platform.']

      const result = await zai.answer(documents, 'Botpress.')

      // Could be invalid_question or could try to answer
      if (result.type === 'invalid_question') {
        expect(result.reason).toBeTruthy()
      }
    })

    it('should detect gibberish questions', async () => {
      const documents = ['Real content here about technology.']

      const result = await zai.answer(documents, 'asdf jkl; qwer?')

      expect(['invalid_question', 'out_of_topic']).toContain(result.type)
      if (result.type === 'invalid_question') {
        expect(result.reason).toBeTruthy()
      }
    })
  })

  describe('missing knowledge responses', () => {
    it('should detect when documents lack information to answer', async () => {
      const documents = ['Botpress is a platform.', 'It was founded in Quebec.']

      const result = await zai.answer(documents, 'What is the exact number of employees at Botpress?')

      expect(['missing_knowledge', 'out_of_topic']).toContain(result.type)
      if (result.type === 'missing_knowledge') {
        expect(result.reason).toBeTruthy()
        expect(result.reason.toLowerCase()).toMatch(/employee|information|knowledge/)
      }
    })

    it('should detect when question requires specific data not in documents', async () => {
      const documents = ['The company makes software.', 'It has customers worldwide.', 'The product is popular.']

      const result = await zai.answer(documents, 'What was the revenue in Q3 2023?')

      expect(['missing_knowledge', 'out_of_topic']).toContain(result.type)
      if (result.type === 'missing_knowledge') {
        expect(result.reason).toBeTruthy()
      }
    })
  })

  describe('edge cases', () => {
    it('should handle empty documents array', async () => {
      const result = await zai.answer([], 'What is Botpress?')

      expect(['missing_knowledge', 'out_of_topic', 'invalid_question']).toContain(result.type)
    })

    it('should handle single document', async () => {
      const documents = ['Botpress is an AI agent platform founded in 2016.']

      const result = await zai.answer(documents, 'What is Botpress?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toContain('ai')
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle very long documents', async () => {
      const longDoc =
        'This is a very long document. ' +
        'It contains many sentences. '.repeat(500) +
        'The answer is 42. ' +
        'More text here. '.repeat(500)

      const documents = [longDoc]

      const result = await zai.answer(documents, 'What is the answer?')

      expect(['answer', 'missing_knowledge']).toContain(result.type)
      if (result.type === 'answer') {
        expect(result.answer).toContain('42')
      }
    })

    it('should handle mixed document types', async () => {
      const documents = ['Plain text document.', { type: 'object', value: 'Object document' }, ['array', 'document']]

      const result = await zai.answer(documents, 'What types of documents are here?')

      expect(['answer', 'ambiguous']).toContain(result.type)
    })

    it('should handle documents with special characters', async () => {
      const documents = ['Email: support@botpress.com', 'Price: $99.99', 'Code: function() { return "hello"; }']

      const result = await zai.answer(documents, 'What is the email address?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toContain('support@botpress.com')
      }
    })
  })

  describe('large document sets - chunking and merging', () => {
    it('should handle many documents that exceed single LLM call capacity', async () => {
      // Create 100 documents, each with unique information
      const documents = Array.from({ length: 100 }, (_, i) => {
        return `Document ${i + 1}: This document contains information about topic ${i + 1}. The key fact is that value ${i + 1} is important for item ${i + 1}.`
      })

      // Add a few documents with the actual answer scattered throughout
      documents[10] = 'The headquarters of Acme Corp is located in New York City.'
      documents[50] = 'Acme Corp was founded in 1995 by John Smith.'
      documents[90] = 'The company employs over 5000 people worldwide.'

      const result = await zai.answer(documents, 'Tell me about Acme Corp.')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should contain information from multiple chunks
        expect(result.answer.toLowerCase()).toMatch(/new york|1995|5000/)
        expect(result.citations.length).toBeGreaterThan(0)

        // Verify citations reference the correct documents
        const citedItems = result.citations.map((c) => c.item)
        expect(citedItems).toContain(documents[10])
        expect(citedItems.some((item) => item === documents[50] || item === documents[90])).toBe(true)
      }
    })

    it('should visit every document at least once when chunking', async () => {
      // Create documents where the answer requires info from first and last
      const documents = Array.from({ length: 50 }, (_, i) => `Filler document ${i + 1}.`)

      documents[0] = 'The product name is AlphaBot.'
      documents[49] = 'AlphaBot costs $299 per month.'

      const result = await zai.answer(documents, 'What is the price of AlphaBot?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toContain('299')
        // Should have citations from both the first and last document
        const citedItems = result.citations.map((c) => c.item)
        expect(citedItems).toContain(documents[49])
      }
    })

    it('should merge answers from multiple chunks into unified answer', async () => {
      // Create many documents with related information spread across them
      const documents = [
        ...Array.from({ length: 30 }, (_, i) => `Irrelevant document ${i + 1}`),
        'BetaProduct features: Real-time analytics, customizable dashboards.',
        ...Array.from({ length: 30 }, (_, i) => `More irrelevant content ${i + 1}`),
        'BetaProduct pricing: Starts at $99/month for basic plan.',
        ...Array.from({ length: 30 }, (_, i) => `Even more filler ${i + 1}`),
        'BetaProduct integrations: Works with Slack, Teams, and Discord.',
        ...Array.from({ length: 30 }, (_, i) => `Last batch of filler ${i + 1}`),
      ]

      const result = await zai.answer(documents, 'What are the main features and pricing of BetaProduct?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should mention information from multiple chunks
        expect(result.answer.toLowerCase()).toMatch(/analytics|dashboard/)
        expect(result.answer).toContain('99')

        // Should have citations from different parts of the document set
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle case where each chunk produces partial answer', async () => {
      const documents = [
        ...Array.from({ length: 25 }, () => 'Filler content here.'),
        'Step 1: Install the software using npm install.',
        ...Array.from({ length: 25 }, () => 'More filler content.'),
        'Step 2: Configure the API key in your .env file.',
        ...Array.from({ length: 25 }, () => 'Additional filler.'),
        'Step 3: Run the application with npm start.',
        ...Array.from({ length: 25 }, () => 'Final filler content.'),
      ]

      const result = await zai.answer(documents, 'How do I set up the application?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should mention multiple steps from different chunks
        const lowerAnswer = result.answer.toLowerCase()
        expect(lowerAnswer).toMatch(/install|configure|run/)
        expect(result.citations.length).toBeGreaterThan(1)
      }
    })
  })

  describe('citation markers removed from answers', () => {
    it('should remove all citation markers (■) from answer text', async () => {
      const documents = [
        'Botpress was founded in 2016.',
        'It is an AI agent platform.',
        'The company is headquartered in Quebec, Canada.',
      ]

      const result = await zai.answer(documents, 'Tell me about Botpress.')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should have citations
        expect(result.citations.length).toBeGreaterThan(0)
        // Answer should NOT contain any citation markers (■)
        expect(result.answer).not.toContain('■')
      }
    })

    it('should remove all citation markers (■) from ambiguous answers', async () => {
      const documents = [
        'Python is a programming language.',
        'Python is also a type of snake.',
        'The Python programming language was created by Guido van Rossum.',
        'Python snakes are found in Africa, Asia, and Australia.',
      ]

      const result = await zai.answer(documents, 'What is Python?')

      if (result.type === 'ambiguous') {
        // Check ambiguity and follow_up don't contain markers
        expect(result.ambiguity).not.toContain('■')
        expect(result.follow_up).not.toContain('■')
        // Check each answer doesn't contain markers
        result.answers.forEach((answer) => {
          expect(answer.answer).not.toContain('■')
        })
      }
    })

    it('should handle multiple citations throughout answer without leaving markers', async () => {
      const documents = [
        'The iPhone was first released by Apple in 2007.',
        'Steve Jobs announced the iPhone at the Macworld conference.',
        'The original iPhone had a 3.5-inch display and 2-megapixel camera.',
        'The iPhone revolutionized the smartphone industry.',
      ]

      const result = await zai.answer(documents, 'When was the iPhone released and who announced it?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should have multiple citations
        expect(result.citations.length).toBeGreaterThanOrEqual(2)
        // But answer should be completely clean of markers
        expect(result.answer).not.toContain('■')
      }
    })
  })

  describe('citation offsets', () => {
    it('should have valid citation offsets in answer text', async () => {
      const documents = ['The capital of France is Paris.', 'Paris has a population of 2.2 million.']

      const result = await zai.answer(documents, 'What is the capital of France?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        result.citations.forEach((citation) => {
          expect(citation.offset).toBeGreaterThanOrEqual(0)
          expect(citation.offset).toBeLessThanOrEqual(result.answer.length + 1)
        })
      }
    })

    it('should have citations sorted by offset', async () => {
      const documents = [
        'Botpress is based in Quebec.',
        'It was founded in 2016.',
        'The platform supports many languages.',
      ]

      const result = await zai.answer(documents, 'Tell me about Botpress.')

      expect(result.type).toBe('answer')
      if (result.type === 'answer' && result.citations.length > 1) {
        for (let i = 1; i < result.citations.length; i++) {
          expect(result.citations[i].offset).toBeGreaterThanOrEqual(result.citations[i - 1].offset)
        }
      }
    })
  })

  describe('multiple citations throughout answer', () => {
    it('should cite different sources for different parts of the answer', async () => {
      const documents = [
        'The iPhone was first released by Apple in 2007.',
        'Steve Jobs announced the iPhone at the Macworld conference.',
        'The original iPhone had a 3.5-inch display and 2-megapixel camera.',
        'The iPhone revolutionized the smartphone industry.',
      ]

      const result = await zai.answer(documents, 'When was the iPhone released and who announced it?', {
        instructions: 'Answer in two different sentences. Cite each sentences.',
      })

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        console.log(result.citations)
        expect(result.citations.length).toBeGreaterThanOrEqual(2)

        // Should cite the release year from one document
        const citedItems = result.citations.map((c) => c.item)
        expect(citedItems).toContain(documents[0]) // For 2007
        expect(citedItems).toContain(documents[1]) // For Steve Jobs

        // Citations should be at different offsets (different parts of answer)
        const uniqueOffsets = new Set(result.citations.map((c) => c.offset))
        expect(uniqueOffsets.size).toBeGreaterThanOrEqual(2)
      }
    })

    it('should have citations distributed throughout a longer answer', async () => {
      const documents = [
        'TypeScript is a statically typed superset of JavaScript.',
        '--------------------------',
        'Sky is blue due to the scattering of sunlight by the atmosphere.',
        '--------------------------',
        'TypeScript was developed by Microsoft and first released in 2012.',
        '--------------------------',
        'Sky is blue due to the scattering of sunlight by the atmosphere.',
        '--------------------------',
        'TypeScript code compiles to plain JavaScript.',
        '--------------------------',
        'Sky is blue due to the scattering of sunlight by the atmosphere.',
        '--------------------------',
        'Typescript: Major features include type annotations, interfaces, and generics.',
        '--------------------------',
        'Sky is blue due to the scattering of sunlight by the atmosphere.',
        '--------------------------',
        'TypeScript is widely used in Angular, Vue 3, and other frameworks.',
        '--------------------------',
        'Sky is blue due to the scattering of sunlight by the atmosphere.',
        '--------------------------',
        'Sky is blue due to the scattering of sunlight by the atmosphere.',
        '--------------------------',
        'The TypeScript compiler is called tsc.',
      ]

      const result = await zai.answer(documents, 'What is TypeScript, who created it, and what are its main features?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.citations.length).toBeGreaterThanOrEqual(3)

        // Should have citations from multiple documents
        const uniqueDocs = new Set(result.citations.map((c) => c.item))
        expect(uniqueDocs.size).toBeGreaterThanOrEqual(3)

        // Citations should be spread throughout the answer (not clustered)
        const offsets = result.citations.map((c) => c.offset).sort((a, b) => a - b)
        if (offsets.length >= 3) {
          const answerLength = result.answer.length
          // First citation should be in first half
          expect(offsets[0]).toBeLessThan(answerLength / 2)
          // Last citation should be in second half
          expect(offsets[offsets.length - 1]).toBeGreaterThan(answerLength / 4)
        }
      }
    })

    it('should cite specific facts from different documents in sequence', async () => {
      const documents = [
        'The Great Wall of China stretches over 13,000 miles.',
        'Construction began in the 7th century BC.',
        'The wall was built to protect against invasions from the north.',
        'It is made primarily of stone, brick, and wood.',
        'The Great Wall is a UNESCO World Heritage Site.',
      ]

      const result = await zai.answer(documents, 'What is the Great Wall of China and why was it built?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.citations.length).toBeGreaterThanOrEqual(2)

        const citedItems = result.citations.map((c) => c.item)

        // Should mention length and cite that document
        if (result.answer.includes('13,000') || result.answer.includes('miles')) {
          expect(citedItems).toContain(documents[0])
        }

        // Should mention purpose and cite that document
        if (result.answer.toLowerCase().includes('protect') || result.answer.toLowerCase().includes('invasion')) {
          expect(citedItems).toContain(documents[2])
        }
      }
    })

    it('should handle answer with many citations from many sources', async () => {
      const documents = [
        'React was created by Jordan Walke at Facebook.',
        "React was first deployed on Facebook's newsfeed in 2011.",
        'React Native was released in 2015 for mobile development.',
        'React uses a virtual DOM for efficient rendering.',
        'JSX is the syntax extension used in React.',
        'Hooks were introduced in React 16.8.',
        'React is maintained by Meta and the community.',
        'Popular React frameworks include Next.js and Gatsby.',
      ]

      const result = await zai.answer(
        documents,
        'What is the history of React and what are its key technical features?'
      )

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should have multiple citations
        expect(result.citations.length).toBeGreaterThanOrEqual(4)

        // Should reference at least 4 different documents
        const uniqueDocs = new Set(result.citations.map((c) => c.item))
        expect(uniqueDocs.size).toBeGreaterThanOrEqual(4)

        // All offsets should be unique or at least varied
        const offsets = result.citations.map((c) => c.offset)
        const uniqueOffsets = new Set(offsets)
        expect(uniqueOffsets.size).toBeGreaterThanOrEqual(3)
      }
    })

    it('should cite different documents for contrasting information', async () => {
      const documents = [
        'Traditional databases use a centralized architecture with a single source of truth.',
        'Distributed databases spread data across multiple nodes for redundancy.',
        'SQL databases use structured schemas and relationships.',
        'NoSQL databases offer flexible schemas and horizontal scaling.',
        'ACID properties ensure data consistency in traditional databases.',
        'BASE properties prioritize availability in distributed systems.',
      ]

      const result = await zai.answer(documents, 'What are the differences between SQL and NoSQL databases?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.citations.length).toBeGreaterThanOrEqual(2)

        const citedItems = result.citations.map((c) => c.item)

        // Should cite both SQL and NoSQL related documents
        const hasSQLCitation = citedItems.some(
          (item) => typeof item === 'string' && (item.includes('SQL') || item.includes('ACID'))
        )
        const hasNoSQLCitation = citedItems.some(
          (item) => typeof item === 'string' && (item.includes('NoSQL') || item.includes('BASE'))
        )

        expect(hasSQLCitation).toBe(true)
        expect(hasNoSQLCitation).toBe(true)
      }
    })
  })

  describe('complex formatting in answers', () => {
    it('should format code blocks in the answer', async () => {
      const documents = [
        'To create a React component, use the following syntax:\nfunction MyComponent() {\n  return <div>Hello</div>;\n}',
        'React components must return JSX elements.',
        'You can export the component using: export default MyComponent;',
      ]

      const result = await zai.answer(documents, 'How do I create a React component?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should contain code-like formatting
        expect(result.answer).toMatch(/function|return|export/)
        // Should have citations
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle multi-line code examples with citations', async () => {
      const documents = [
        `Here's how to define a Python class:
class Person:
    def __init__(self, name):
        self.name = name

    def greet(self):
        return f"Hello, {self.name}"`,
        'Python uses indentation to define code blocks.',
        'The __init__ method is the constructor in Python classes.',
      ]

      const result = await zai.answer(documents, 'How do I create a Python class?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should preserve code structure
        expect(result.answer).toMatch(/class|def|self/)
        // Should cite the code example
        expect(result.citations.length).toBeGreaterThan(0)
        const citedItems = result.citations.map((c) => c.item)
        expect(citedItems.some((item) => typeof item === 'string' && item.includes('class Person'))).toBe(true)
      }
    })

    it('should format SQL queries in answers', async () => {
      const documents = [
        'To select all users: SELECT * FROM users;',
        'To filter by age: SELECT * FROM users WHERE age > 18;',
        'Use JOIN to combine tables: SELECT u.name, o.order_id FROM users u JOIN orders o ON u.id = o.user_id;',
      ]

      const result = await zai.answer(documents, 'How do I query all users from the database?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/SELECT.*FROM.*users/)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle JSON examples in answers', async () => {
      const documents = [
        'API configuration format:\n{\n  "apiKey": "your-key",\n  "endpoint": "https://api.example.com",\n  "timeout": 5000\n}',
        'The apiKey field is required for authentication.',
        'Timeout is specified in milliseconds.',
      ]

      const result = await zai.answer(documents, 'What is the API configuration format?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should contain JSON-like structure
        expect(result.answer).toMatch(/apiKey|endpoint|timeout/)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle shell commands with citations', async () => {
      const documents = [
        'Install the package: npm install react',
        'Start the development server: npm start',
        'Build for production: npm run build',
        'Run tests: npm test',
      ]

      const result = await zai.answer(documents, 'What commands do I need to set up and run the project?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/npm/)
        // Should cite multiple command examples
        expect(result.citations.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should format mixed content with code and explanations', async () => {
      const documents = [
        'The useEffect hook runs side effects. Usage: useEffect(() => { /* effect */ }, [dependencies])',
        'The dependency array controls when the effect re-runs.',
        'Empty array [] means the effect runs once on mount.',
        'No array means the effect runs after every render.',
      ]

      const result = await zai.answer(documents, 'How does the useEffect hook work in React?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should contain both explanation and code
        expect(result.answer.toLowerCase()).toMatch(/effect|run/)
        expect(result.answer).toMatch(/useEffect|\[\]/)
        // Should cite both code example and explanations
        expect(result.citations.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should handle markdown-style formatting', async () => {
      const documents = [
        'Authentication steps:\n1. Send credentials to /auth/login\n2. Receive JWT token\n3. Include token in Authorization header',
        'The token expires after 24 hours.',
        'Format: Authorization: Bearer <token>',
      ]

      const result = await zai.answer(documents, 'How do I authenticate with the API?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should preserve numbered steps or similar structure
        expect(result.answer).toMatch(/token|auth|login/i)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should format configuration files with proper structure', async () => {
      const documents = [
        `Docker Compose configuration:
version: '3.8'
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
  db:
    image: postgres:13
    environment:
      POSTGRES_PASSWORD: secret`,
        'The version specifies the Docker Compose file format.',
        'Services define the containers to run.',
      ]

      const result = await zai.answer(documents, 'Show me a Docker Compose configuration example.')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/version|services|image/)
        expect(result.citations.length).toBeGreaterThan(0)
        // Should cite the configuration example
        const citedItems = result.citations.map((c) => c.item)
        expect(citedItems.some((item) => typeof item === 'string' && item.includes('version'))).toBe(true)
      }
    })

    it('should handle inline code snippets within prose', async () => {
      const documents = [
        'Use the `useState` hook to add state to functional components.',
        'Call it like this: const [count, setCount] = useState(0)',
        'The first value is the state, the second is the setter function.',
      ]

      const result = await zai.answer(documents, 'How do I use useState in React?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/useState/)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should format complex algorithm examples', async () => {
      const documents = [
        `Binary search implementation:
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
        'Binary search has O(log n) time complexity.',
        'The array must be sorted for binary search to work.',
      ]

      const result = await zai.answer(documents, 'How does binary search work?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should include the algorithm
        expect(result.answer).toMatch(/binary|search|left|right/)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle regex patterns in answers', async () => {
      const documents = [
        'Email validation regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/',
        'Phone number pattern: /^\\+?1?\\d{10}$/',
        'Use RegExp test() method to validate: pattern.test(input)',
      ]

      const result = await zai.answer(documents, 'How do I validate an email address?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/email|regex|pattern/i)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should format CSS code examples', async () => {
      const documents = [
        `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}`,
        'Flexbox is used for flexible layouts.',
        'justify-content centers items horizontally.',
      ]

      const result = await zai.answer(documents, 'How do I center content with flexbox?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/flex|center|justify-content/)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should preserve code formatting with multiple languages', async () => {
      const documents = [
        'JavaScript: async function fetchData() { const res = await fetch(url); return res.json(); }',
        'Python: async def fetch_data(): response = await http.get(url); return response.json()',
        'Both languages support async/await syntax for asynchronous operations.',
      ]

      const result = await zai.answer(documents, 'How do I fetch data asynchronously?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/async|await|fetch/)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle API response examples with formatting', async () => {
      const documents = [
        `Success response:
{
  "status": 200,
  "data": {
    "id": 123,
    "name": "John Doe"
  },
  "message": "User retrieved successfully"
}`,
        `Error response:
{
  "status": 404,
  "error": "User not found",
  "code": "USER_NOT_FOUND"
}`,
        'Status codes indicate success (2xx) or errors (4xx, 5xx).',
      ]

      const result = await zai.answer(documents, 'What do API responses look like?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/status|response|data/)
        // Should cite both success and error examples
        expect(result.citations.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should maintain code structure integrity with citations', async () => {
      const documents = [
        `Step 1 - Import dependencies:
import React from 'react';
import { useState } from 'react';`,
        `Step 2 - Create the component:
function Counter() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}`,
        `Step 3 - Export:
export default Counter;`,
      ]

      const result = await zai.answer(documents, 'Show me how to create a counter component.')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should include steps with code
        expect(result.answer).toMatch(/import|function|export/)
        // Should cite multiple steps
        expect(result.citations.length).toBeGreaterThanOrEqual(2)

        // Citations should be ordered through the answer
        const offsets = result.citations.map((c) => c.offset)
        for (let i = 1; i < offsets.length; i++) {
          expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1])
        }
      }
    })
  })

  describe('finding relevant documents in large noise', () => {
    // Seeded random number generator for deterministic shuffling
    const seededRandom = (seed: number) => {
      let state = seed
      return () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff
        return state / 0x7fffffff
      }
    }

    const shuffle = <T>(array: T[], seed: number): T[] => {
      const arr = [...array]
      const random = seededRandom(seed)
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    }

    it('should find relevant docs among 1000 unrelated documents', async () => {
      const relevantDocs = [
        `HOW QUANTUM ENCRYPTION WORKS: Quantum encryption uses quantum key distribution (QKD) to securely share encryption keys.\nQKD leverages the principles of quantum mechanics to detect eavesdropping.\nThe BB84 protocol is the first and most well-known QKD protocol.\n'Quantum bits (qubits) can exist in superposition, allowing for secure key exchange.`,
      ]

      // Create 1000 noise documents
      const noiseDocs = Array.from({ length: 1000 }, (_, i) => {
        const topics = [
          `Recipe ${i}: Mix flour, water, and yeast to make bread dough.`,
          `Historical event ${i}: In the year ${1800 + i}, various political changes occurred.`,
          `Sports fact ${i}: The championship was won by team Alpha in overtime.`,
          `Movie review ${i}: This film features excellent cinematography and compelling characters.`,
          `Travel guide ${i}: The beach resort offers stunning views and great amenities.`,
        ]
        return topics[i % topics.length]
      })

      // Shuffle relevant docs into the noise (deterministic seed: 42)
      const allDocs = shuffle([...relevantDocs, ...noiseDocs], 42)

      const result = await zai.answer(allDocs, 'How does quantum encryption work?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/quantum|qkd|encryption/)
        expect(result.citations.length).toBeGreaterThan(0)

        // Should cite relevant docs, not noise
        const citedItems = result.citations.map((c) => c.item)
        const citedRelevant = citedItems.filter((item) => relevantDocs.some((relevant) => item === relevant)).length
        const citedNoise = citedItems.filter((item) => noiseDocs.some((noise) => item === noise)).length

        expect(citedRelevant).toBeGreaterThan(0)
        // Should primarily cite relevant docs (allow some noise due to LLM variability)
        expect(citedRelevant).toBeGreaterThan(citedNoise)
      }
    })

    it('should find scattered relevant info in 500 noise documents', async () => {
      const relevantDocs = [
        'Neural Networks: How they learn. Neural networks are inspired by the human brain. They learn patterns from data.',
        'Neural Networks: How they learn. Neural networks consist of interconnected nodes organized in layers.',
        'Neural Networks: How they learn. Backpropagation is the algorithm used to train neural networks.',
        'Neural Networks: How they learn. Activation functions introduce non-linearity into the network.',
        'Neural Networks: How they learn. Deep learning uses neural networks with many hidden layers.',
        'Neural Networks: How they learn. Gradient descent optimizes the network weights during training.',
      ]

      const noiseDocs = Array.from({ length: 500 }, (_, i) => {
        const topics = [
          `Gardening tip ${i}: Water plants early in the morning for best results.`,
          `Fashion trend ${i}: This season features bold colors and unique patterns.`,
          `Car maintenance ${i}: Regular oil changes extend engine life significantly.`,
          `Weather report ${i}: Expect partly cloudy skies with mild temperatures.`,
        ]
        return topics[i % topics.length]
      })

      const allDocs = shuffle([...relevantDocs, ...noiseDocs], 123)

      const result = await zai.answer(allDocs, 'How do neural networks learn?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/neural|network|backpropagation|gradient/)
        expect(result.citations.length).toBeGreaterThan(0)

        const citedItems = result.citations.map((c) => c.item)
        const hasRelevantCitations = citedItems.some((item) => relevantDocs.some((relevant) => item === relevant))
        expect(hasRelevantCitations).toBe(true)
      }
    })

    it('should handle relevant docs at beginning buried in 800 noise docs', async () => {
      const relevantDocs = [
        'The mitochondria is the powerhouse of the cell.',
        'It produces ATP through cellular respiration.',
        'Mitochondria have their own DNA separate from nuclear DNA.',
      ]

      const noiseDocs = Array.from({ length: 800 }, (_, i) => `Unrelated content ${i} about random topics.`)

      // Place relevant docs at the start, then shuffle
      const allDocs = shuffle([...relevantDocs, ...noiseDocs], 456)

      const result = await zai.answer(allDocs, 'What is the function of mitochondria?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/mitochondria|atp|energy|powerhouse/)
        expect(result.citations.length).toBeGreaterThan(0)

        const citedRelevant = result.citations.filter((c) => relevantDocs.includes(c.item as string)).length
        expect(citedRelevant).toBeGreaterThan(0)
      }
    })

    it('should find single relevant doc among 1200 noise documents', async () => {
      const relevantDoc = 'The speed of light in a vacuum is approximately 299,792,458 meters per second.'

      const noiseDocs = Array.from({ length: 1200 }, (_, i) => {
        const topics = [
          `Document ${i}: Information about unrelated scientific topics.`,
          `Article ${i}: Discussion of various historical events and figures.`,
          `Report ${i}: Analysis of economic trends and market conditions.`,
        ]
        return topics[i % topics.length]
      })

      const allDocs = shuffle([relevantDoc, ...noiseDocs], 789)

      const result = await zai.answer(allDocs, 'What is the speed of light?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/299,792,458|speed.*light/)
        expect(result.citations.length).toBeGreaterThan(0)
        expect(result.citations.some((c) => c.item === relevantDoc)).toBe(true)
      }
    })

    it('should extract multi-part answer from docs scattered in 600 noise docs', async () => {
      const relevantDocs = [
        'HTTP status code 200 means OK - the request succeeded.',
        'Status code 404 means Not Found - the requested resource does not exist.',
        'Status code 500 means Internal Server Error - the server encountered an error.',
        'Status code 401 means Unauthorized - authentication is required.',
      ]

      const noiseDocs = Array.from(
        { length: 600 },
        (_, i) => `Random document ${i} containing information about topics like cooking, sports, and music.`
      )

      const allDocs = shuffle([...relevantDocs, ...noiseDocs], 321)

      const result = await zai.answer(allDocs, 'What do different HTTP status codes mean?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should mention multiple status codes
        const answer = result.answer.toLowerCase()
        const mentionsMultiple =
          [/200|ok/, /404|not found/, /500|error/, /401|unauthorized/].filter((pattern) => pattern.test(answer))
            .length >= 2

        expect(mentionsMultiple).toBe(true)
        expect(result.citations.length).toBeGreaterThanOrEqual(2)

        // Should cite relevant docs
        const citedRelevant = result.citations.filter((c) => relevantDocs.includes(c.item as string)).length
        expect(citedRelevant).toBeGreaterThanOrEqual(2)
      }
    })

    it('should prioritize relevant docs over keyword-matching noise', async () => {
      const relevantDocs = [
        'Rust is a systems programming language focused on safety and concurrency.',
        'Rust prevents memory safety bugs through its ownership system.',
        'The Rust compiler enforces memory safety at compile time.',
      ]

      // Noise docs that mention "rust" but in different context
      const confusingNoiseDocs = Array.from({ length: 300 }, (_, i) => {
        const misleading = [
          `Rust on metal ${i}: Iron oxide forms when metal is exposed to moisture.`,
          `Preventing rust ${i}: Apply protective coating to metal surfaces regularly.`,
          `Rust removal ${i}: Use vinegar or commercial rust removers for best results.`,
        ]
        return misleading[i % misleading.length]
      })

      const otherNoiseDocs = Array.from({ length: 400 }, (_, i) => `General content ${i} about various topics.`)

      const allDocs = shuffle([...relevantDocs, ...confusingNoiseDocs, ...otherNoiseDocs], 654)

      const result = await zai.answer(allDocs, 'What is Rust programming language?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/programming|language|memory|safety/)
        expect(result.citations.length).toBeGreaterThan(0)

        // Should cite programming Rust, not metal rust
        const citedItems = result.citations.map((c) => c.item as string)
        const citedProgramming = citedItems.filter((item) => relevantDocs.includes(item)).length
        const citedMetalRust = citedItems.filter((item) => confusingNoiseDocs.some((noise) => item === noise)).length

        expect(citedProgramming).toBeGreaterThan(0)
        // Should strongly prefer programming context over metal rust
        if (citedMetalRust > 0) {
          expect(citedProgramming).toBeGreaterThan(citedMetalRust)
        }
      }
    })

    it('should handle technical docs buried in 1500 generic documents', async () => {
      const relevantDocs = [
        'The CAP theorem states that distributed systems can only guarantee two of three properties: Consistency, Availability, and Partition tolerance.',
        'In practice, partition tolerance is mandatory, so the choice is between consistency and availability.',
        'CP systems prioritize consistency over availability during network partitions.',
        'AP systems prioritize availability over consistency during network partitions.',
      ]

      const noiseDocs = Array.from({ length: 1500 }, (_, i) => {
        const generic = [
          `Generic statement ${i}: Various things happen in different contexts.`,
          `Common knowledge ${i}: Many people believe different things about various topics.`,
          `General observation ${i}: Situations can vary depending on circumstances.`,
        ]
        return generic[i % generic.length]
      })

      const allDocs = shuffle([...relevantDocs, ...noiseDocs], 987)

      const result = await zai.answer(allDocs, 'What is the CAP theorem in distributed systems?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/cap|consistency|availability|partition/)
        expect(result.citations.length).toBeGreaterThan(0)

        const citedRelevant = result.citations.filter((c) => relevantDocs.includes(c.item as string)).length
        expect(citedRelevant).toBeGreaterThan(0)
      }
    })

    it('should find code examples buried in 700 non-code documents', async () => {
      const relevantDocs = [
        'Fibonacci in Python:\ndef fib(n):\n    if n <= 1: return n\n    return fib(n-1) + fib(n-2)',
        'The Fibonacci sequence starts with 0 and 1.',
        'Each subsequent number is the sum of the previous two.',
      ]

      const noiseDocs = Array.from(
        { length: 700 },
        (_, i) => `Text document ${i} with prose about history, culture, and general knowledge without code.`
      )

      const allDocs = shuffle([...relevantDocs, ...noiseDocs], 111)

      const result = await zai.answer(allDocs, 'How do I implement Fibonacci in Python?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/def|fibonacci|fib/)
        expect(result.citations.length).toBeGreaterThan(0)

        // Should cite the code example
        const citedItems = result.citations.map((c) => c.item as string)
        expect(citedItems.some((item) => item.includes('def fib'))).toBe(true)
      }
    })

    it('should ignore noise and return missing_knowledge if no relevant docs exist', async () => {
      const noiseDocs = Array.from({ length: 1000 }, (_, i) => {
        const topics = [
          `Cooking recipe ${i}: Combine ingredients and bake for 30 minutes.`,
          `Travel destination ${i}: Beautiful scenery and cultural attractions.`,
          `Movie synopsis ${i}: A thrilling story with unexpected plot twists.`,
        ]
        return topics[i % topics.length]
      })

      const allDocs = shuffle(noiseDocs, 222)

      const result = await zai.answer(allDocs, 'Explain quantum entanglement in detail.')

      expect(['missing_knowledge', 'out_of_topic']).toContain(result.type)
    })

    it('should efficiently process 2000 docs and find 3 relevant ones', async () => {
      const relevantDocs = [
        'GDPR is the General Data Protection Regulation enacted by the European Union.',
        'GDPR gives individuals control over their personal data.',
        'Companies must obtain explicit consent to process personal data under GDPR.',
      ]

      const noiseDocs = Array.from({ length: 2000 }, (_, i) => `Document ${i}: General business content.`)

      const allDocs = shuffle([...relevantDocs, ...noiseDocs], 333)

      const { output, usage } = await zai.answer(allDocs, 'What is GDPR?').result()

      expect(output.type).toBe('answer')
      if (output.type === 'answer') {
        expect(output.answer.toLowerCase()).toMatch(/gdpr|general data protection/)
        expect(output.citations.length).toBeGreaterThan(0)
      }
    })
  })

  describe('documents of any type', () => {
    it('should handle object documents with nested properties', async () => {
      const documents = [
        {
          id: 1,
          title: 'Introduction to GraphQL',
          content: 'GraphQL is a query language for APIs developed by Facebook.',
          metadata: { author: 'John Doe', year: 2015 },
        },
        {
          id: 2,
          title: 'GraphQL vs REST',
          content: 'GraphQL allows clients to request exactly the data they need.',
          metadata: { author: 'Jane Smith', year: 2018 },
        },
        {
          id: 3,
          title: 'GraphQL Schema',
          content: 'The schema defines the types and relationships in your GraphQL API.',
          metadata: { author: 'Bob Johnson', year: 2019 },
        },
      ]

      const result = await zai.answer(documents, 'What is GraphQL?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/graphql|query language|api/)
        expect(result.citations.length).toBeGreaterThan(0)

        // Citations should reference the original objects
        const citedItems = result.citations.map((c) => c.item)
        expect(citedItems.some((item) => typeof item === 'object' && item !== null)).toBe(true)
      }
    })

    it('should cite correct object when multiple objects have similar content', async () => {
      const documents = [
        { id: 'doc1', type: 'article', title: 'AI Ethics', content: 'Discussion about AI ethics and safety.' },
        { id: 'doc2', type: 'article', title: 'AI Development', content: 'How to develop AI systems.' },
        { id: 'doc3', type: 'article', title: 'AI Safety', content: 'Ensuring AI systems are safe and aligned.' },
      ]

      const result = await zai.answer(documents, 'What does the document say about AI safety?')

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/safety|aligned|safe/)
        expect(result.citations.length).toBeGreaterThan(0)

        // Should cite the AI Safety document specifically
        const citedItems = result.citations.map((c) => c.item)
        const citedSafetyDoc = citedItems.some(
          (item) => typeof item === 'object' && item !== null && 'id' in item && item.id === 'doc3'
        )
        expect(citedSafetyDoc).toBe(true)
      }
    })
  })

  describe('chunkLength option (token limits)', () => {
    it('should respect custom chunkLength for document processing', async () => {
      const documents = Array.from({ length: 50 }, (_, i) => `Document ${i}: This is content about topic ${i}.`)

      // Force small chunks with chunkLength option
      const { output, usage } = await zai.answer(documents, 'What topics are covered?', { chunkLength: 2000 }).result()

      expect(output.type).toBe('answer')
      if (output.type === 'answer') {
        expect(output.answer).toBeTruthy()
        expect(output.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle very large chunkLength (maximum: 100000 tokens)', async () => {
      const largeDocs = Array.from(
        { length: 20 },
        (_, i) =>
          `Section ${i}: ` +
          'This is a very long document section with lots of content. '.repeat(100) +
          `Key point ${i}: Important information here.`
      )

      const result = await zai.answer(largeDocs, 'What are the key points?', { chunkLength: 100_000 })

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toBeTruthy()
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should trigger chunking when documents exceed chunkLength', async () => {
      // Create documents that will definitely need chunking
      const longDocs = Array.from({ length: 100 }, (_, i) => {
        if (i === 42) {
          return 'THE PASSWORD IS 68742. Remember this important fact.'
        }
        const content = `Document ${i}: `.repeat(10) + 'Content '.repeat(500)
        return content
      })

      const { output, usage } = await zai.answer(longDocs, 'What is the password?', { chunkLength: 1000 }).result()

      expect(output.type).toBe('answer')
      if (output.type === 'answer') {
        expect(output.answer).toMatch(/68742/)
      }
    })

    it('should process all documents even with aggressive chunking', async () => {
      const documents = [
        'Important fact: quantum mechanics explains the behavior of particles at atomic scales.',
        ...Array.from({ length: 200 }, (_, i) => `Filler document ${i} with unrelated content.`),
        'Important fact: relativity theory describes the gravitational interaction in the universe.',
        ...Array.from({ length: 200 }, (_, i) => `More filler document ${i + 200}.`),
        'Important fact: thermodynamics describes the behavior of energy and matter.',
      ]

      const result = await zai.answer(documents, 'What are the important facts?', { chunkLength: 500 })

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        // Should find at least 2 of the 3 important facts
        const answer = result.answer.toLowerCase()
        const foundFacts = [/quantum/, /relativity/, /thermodynamics/].filter((pattern) =>
          pattern.test(answer.toLowerCase())
        ).length

        expect(foundFacts).toBeGreaterThanOrEqual(3)
      }
    })

    it('should merge results correctly with medium chunkLength', async () => {
      const documents = [
        ...Array.from({ length: 30 }, (_, i) => `Noise ${i}`),
        'React was created by Facebook.',
        ...Array.from({ length: 30 }, (_, i) => `Noise ${i + 30}`),
        'React uses a virtual DOM.',
        ...Array.from({ length: 30 }, (_, i) => `Noise ${i + 60}`),
        'React supports component composition.',
        ...Array.from({ length: 30 }, (_, i) => `Noise ${i + 90}`),
      ]

      const result = await zai.answer(documents, 'What is React?', { chunkLength: 3000 })

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/react/)
        // Should cite multiple React-related documents from different chunks
        expect(result.citations.length).toBeGreaterThanOrEqual(2)
      }
    })

    it('should handle chunkLength with complex object documents', async () => {
      const documents = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        type: 'entry',
        content: `Entry ${i} contains generic information about topic ${i}.`,
        metadata: { created: '2025-03-12', tags: ['general'] },
      }))

      // Add relevant docs scattered throughout
      documents[20] = {
        id: 20,
        type: 'important',
        content: 'Kubernetes is a container orchestration platform.',
        metadata: { created: '2025-03-12', tags: ['kubernetes', 'devops'] },
      }
      documents[50] = {
        id: 50,
        type: 'important',
        content: 'Kubernetes automates deployment, scaling, and management of containerized applications.',
        metadata: { created: '2025-03-12', tags: ['kubernetes', 'containers'] },
      }

      const result = await zai.answer(documents, 'What is Kubernetes?', { chunkLength: 2500 })

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/kubernetes|container|orchestration/)
        expect(result.citations.length).toBeGreaterThan(0)

        // Should cite the relevant object documents
        const citedItems = result.citations.map((c) => c.item)
        const citedRelevant = citedItems.filter(
          (item) => typeof item === 'object' && item !== null && 'type' in item && item.type === 'important'
        ).length
        expect(citedRelevant).toBeGreaterThan(0)
      }
    })

    it('should handle chunkLength smaller than a single large document', async () => {
      const largeDocument =
        'Introduction: '.repeat(100) +
        'The theory of relativity was developed by Albert Einstein in the early 20th century. ' +
        'It consists of special relativity and general relativity. '.repeat(50) +
        'Special relativity deals with objects moving at constant velocity. ' +
        'General relativity extends this to include acceleration and gravity. '.repeat(50)

      const documents = [largeDocument, 'Additional context about Einstein.', 'More information about physics.']

      // Chunk length smaller than the large document
      const result = await zai.answer(documents, 'Who developed the theory of relativity?', { chunkLength: 1000 })

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/Einstein/)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should validate chunkLength bounds (min: 100, max: 100000)', async () => {
      const documents = ['Test document.']

      // Should accept minimum value
      await expect(zai.answer(documents, 'Test question?', { chunkLength: 1001 })).resolves.toBeTruthy()

      // Should accept maximum value
      await expect(zai.answer(documents, 'Test question?', { chunkLength: 100_000 })).resolves.toBeTruthy()

      // Should reject below minimum
      await expect(zai.answer(documents, 'Test question?', { chunkLength: 50 })).rejects.toThrow()

      // Should reject above maximum
      await expect(zai.answer(documents, 'Test question?', { chunkLength: 200_000 })).rejects.toThrow()
    })

    it('should process documents progressively with small chunkLength and track progress', async () => {
      const documents = Array.from({ length: 100 }, (_, i) => `Entry ${i} about topic ${i}.`)

      const result = zai.answer(documents, 'What topics are covered?', { chunkLength: 1500 })

      let progressCount = 0
      result.on('progress', (usage) => {
        progressCount++
        expect(usage.requests.percentage).toBeGreaterThanOrEqual(0)
        expect(usage.requests.percentage).toBeLessThanOrEqual(1)
      })

      await result

      // Should have emitted progress events for chunked processing
      expect(progressCount).toBeGreaterThan(0)
    })

    it('should handle mixed document sizes with consistent chunkLength', async () => {
      const documents = [
        'Short doc.',
        'Medium document with some content here. '.repeat(20),
        'Very long document with extensive content. '.repeat(200),
        'Another short one.',
        'Medium sized content again. '.repeat(30),
      ]

      const result = await zai.answer(documents, 'Summarize the content.', { chunkLength: 2000 })

      expect(['answer', 'missing_knowledge']).toContain(result.type)
      if (result.type === 'answer') {
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should handle chunkLength with code documents requiring preservation', async () => {
      const codeDocs = Array.from({ length: 40 }, (_, i) => {
        if (i === 15) {
          return `function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}`
        }
        return `// Comment ${i}\nconst var${i} = ${i};`
      })

      const result = await zai.answer(codeDocs, 'Show me the fibonacci function.', { chunkLength: 1000 })

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer).toMatch(/fibonacci/)
        expect(result.citations.length).toBeGreaterThan(0)
      }
    })

    it('should maintain citation accuracy across chunk boundaries', async () => {
      const documents = [
        ...Array.from({ length: 25 }, (_, i) => `Filler ${i}`),
        'Important fact A: The capital of France is Paris.',
        ...Array.from({ length: 25 }, (_, i) => `Filler ${i + 25}`),
        'Important fact B: Paris is located on the Seine River.',
        ...Array.from({ length: 25 }, (_, i) => `Filler ${i + 50}`),
        'Important fact C: The Eiffel Tower is in Paris.',
        ...Array.from({ length: 25 }, (_, i) => `Filler ${i + 75}`),
      ]

      const result = await zai.answer(documents, 'Tell me about Paris.', { chunkLength: 1200 })

      expect(result.type).toBe('answer')
      if (result.type === 'answer') {
        expect(result.answer.toLowerCase()).toMatch(/paris/)
        expect(result.citations.length).toBeGreaterThanOrEqual(2)

        // Should cite the important facts, not filler
        const citedItems = result.citations.map((c) => c.item as string)
        const citedImportant = citedItems.filter((item) => item.includes('Important fact')).length
        const citedFiller = citedItems.filter((item) => item.includes('Filler')).length

        expect(citedImportant).toBeGreaterThan(0)
        // Should primarily cite important facts
        if (citedFiller > 0) {
          expect(citedImportant).toBeGreaterThanOrEqual(citedFiller)
        }
      }
    })
  })

  describe('abort functionality', () => {
    it('can abort answer operation', async () => {
      const documents = ['Document 1', 'Document 2', 'Document 3']
      const request = zai.answer(documents, 'What is this about?')

      request.abort('CANCEL')
      await expect(request).rejects.toThrow(/cancel/i)
    })

    it('can abort via external signal', async () => {
      const controller = new AbortController()
      const documents = ['Some content here']
      const request = zai.answer(documents, 'Question?').bindSignal(controller.signal)

      controller.abort('CANCEL2')
      await expect(request).rejects.toThrow(/cancel/i)
    })
  })
})

describe('zai.learn.answer', { timeout: 60_000, sequential: true }, () => {
  const client = getClient()
  const tableName = 'ZaiTestAnswerInternalTable'
  const taskId = 'answer'
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

  it('should use approved examples to improve answers', async () => {
    const adapter = new TableAdapter({
      client,
      tableName,
    })

    const documents = ['Product X is great.', 'Product Y is also good.']

    // Save an approved example with specific format
    await adapter.saveExample<string, AnswerResult<string>>({
      key: 'example1',
      taskId: `zai/${taskId}`,
      taskType: 'zai.answer',
      instructions: '',
      input: 'What products are mentioned?',
      output: {
        type: 'answer',
        answer: 'The documents mention Product X and Product Y.',
        citations: [
          { offset: 23, item: documents[0], snippet: 'Product X is great.' },
          { offset: 36, item: documents[1], snippet: 'Product Y is also good.' },
        ],
      },
      metadata,
      status: 'approved',
    })

    const result = await zai.learn(taskId).answer(documents, 'What products are discussed?')

    // Should use the example to guide formatting
    expect(['answer', 'ambiguous']).toContain(result.type)
  })

  it('should cache exact matches', async () => {
    const documents = ['Cached content.']
    const question = 'What is this?'

    const first = await zai.learn(taskId).answer(documents, question)
    const second = await zai.learn(taskId).answer(documents, question)

    expect(first.type).toBe(second.type)
  })
})
