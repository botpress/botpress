import { convertToString, convertToTags } from './utils'

const convertToTagsTests = [
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
    output:
      '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]]'
  },
  {
    input: '$variable $variable2{{event}} {{event2}} $variable',
    output:
      '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]][[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]] [[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '$variable $variable2 {{event}}{{event2}} $variable',
    output:
      '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]][[{"value": "event2", "prefix": "{{"}]] [[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '$variable $variable2 {{event}} {{event2}}$variable',
    output:
      '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]][[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '$variable$variable2 {{event}} {{event2}} $variable',
    output:
      '[[{"value": "variable", "prefix": "$"}]][[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]] [[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '$variable$variable2{{event}}{{event2}}$variable',
    output:
      '[[{"value": "variable", "prefix": "$"}]][[{"value": "variable2", "prefix": "$"}]][[{"value": "event", "prefix": "{{"}]][[{"value": "event2", "prefix": "{{"}]][[{"value": "variable", "prefix": "$"}]]'
  },
  {
    input: '$variable$variable2{{event}}{{event2}}"$variable"',
    output:
      '[[{"value": "variable", "prefix": "$"}]][[{"value": "variable2", "prefix": "$"}]][[{"value": "event", "prefix": "{{"}]][[{"value": "event2", "prefix": "{{"}]]"[[{"value": "variable", "prefix": "$"}]]"'
  },
  {
    input: '$variable"$variable2"{{event}}"{{event2}}"$variable"\'$test\'',
    output:
      '[[{"value": "variable", "prefix": "$"}]]"[[{"value": "variable2", "prefix": "$"}]]"[[{"value": "event", "prefix": "{{"}]]"[[{"value": "event2", "prefix": "{{"}]]"[[{"value": "variable", "prefix": "$"}]]"\'[[{"value": "test", "prefix": "$"}]]\''
  }
]

const convertToStringTests = [
  {
    input: '[[{"value": "variable", "prefix": "$"}]]',
    output: '$variable'
  },
  {
    input: '[[{"value": "event", "prefix": "{{"}]]',
    output: '{{event}}'
  },
  {
    input:
      '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]]',
    output: '$variable $variable2 {{event}} {{event2}}'
  },
  {
    input:
      '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]][[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]] [[{"value": "variable", "prefix": "$"}]]',
    output: '$variable $variable2 {{event}} {{event2}} $variable'
  },
  {
    input:
      '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]][[{"value": "event2", "prefix": "{{"}]] [[{"value": "variable", "prefix": "$"}]]',
    output: '$variable $variable2 {{event}} {{event2}} $variable'
  },
  {
    input:
      '[[{"value": "variable", "prefix": "$"}]] [[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]][[{"value": "variable", "prefix": "$"}]]',
    output: '$variable $variable2 {{event}} {{event2}} $variable'
  },
  {
    input:
      '[[{"value": "variable", "prefix": "$"}]][[{"value": "variable2", "prefix": "$"}]] [[{"value": "event", "prefix": "{{"}]] [[{"value": "event2", "prefix": "{{"}]] [[{"value": "variable", "prefix": "$"}]]',
    output: '$variable $variable2 {{event}} {{event2}} $variable'
  },
  {
    input:
      '[[{"value": "variable", "prefix": "$"}]][[{"value": "variable2", "prefix": "$"}]][[{"value": "event", "prefix": "{{"}]][[{"value": "event2", "prefix": "{{"}]][[{"value": "variable", "prefix": "$"}]]',
    output: '$variable $variable2 {{event}} {{event2}} $variable'
  },
  {
    input:
      '[[{"value": "variable", "prefix": "$"}]][[{"value": "variable2", "prefix": "$"}]][[{"value": "event", "prefix": "{{"}]][[{"value": "event2", "prefix": "{{"}]]"[[{"value": "variable", "prefix": "$"}]]"',
    output: '$variable $variable2 {{event}} {{event2}}"$variable"'
  },
  {
    input:
      '[[{"value": "variable", "prefix": "$"}]]"[[{"value": "variable2", "prefix": "$"}]]"[[{"value": "event", "prefix": "{{"}]]"[[{"value": "event2", "prefix": "{{"}]]"[[{"value": "variable", "prefix": "$"}]]"\'[[{"value": "test", "prefix": "$"}]]\'',
    output: '$variable"$variable2"{{event}}"{{event2}}"$variable"\'$test\''
  }
]

describe('Utility methods for super input', () => {
  convertToTagsTests.forEach(({ input, output }) => {
    test(`convertToTags test cases: ${input}`, () => {
      expect(convertToTags(input)).toEqual(output)
    })
  })

  convertToStringTests.forEach(({ input, output }) => {
    test(`convertToString test cases: ${input}`, () => {
      expect(convertToString(input)).toEqual(output)
    })
  })
})
