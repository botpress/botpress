import { convertToString, convertToTags } from './utils'

const convertTests = [
  {
    input: '$variable',
    output: '[[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '{{event}}',
    output: '[[{"value": "event", "prefix": "{{"}]]'
  },
  {
    input: '$variable $variable2 {{event}} {{event2}}',
    output: '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]]'
  },
  {
    input: '$variable $variable2{{event}} {{event2}} $variable',
    output: '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]][[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]] [[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '$variable $variable2 {{event}}{{event2}} $variable',
    output: '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]][[{"value": "event2", "prefix": "{{"}]] [[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '$variable $variable2 {{event}} {{event2}}$variable',
    output: '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]][[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '$variable$variable2 {{event}} {{event2}} $variable',
    output: '[[{"value": "variable", "prefix": "$"}]][[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]] [[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '$variable$variable2{{event}}{{event2}}$variable',
    output: '[[{"value": "variable", "prefix": "$"}]][[{"value": "variable2", "prefix": "$"}]][[{"value": "event", "prefix": "{{"}]][[{"value": "event2", "prefix": "{{"}]][[{"value": "variable", "prefix": "$"}]]'
  }
]

describe('Utility methods for super input', () => {
  convertTests.forEach(({ input, output }) => {
    test(`convertToTags test cases: ${input}`, () => {
      expect(convertToTags(input)).toEqual(output)
    })
  })

  convertTests.forEach(({ input, output }) => {
    test(`convertToString test cases: ${output}`, () => {
      expect(convertToString(output)).toEqual(input)
    })
  })
})
