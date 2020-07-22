import { renderRecursive } from './templating'

test('Render recursive template', () => {
  const ctx = {
    en: 'hello',
    sv: 'hejhej',
    es: 'hola',
    fr: 'bonjour',
    nested: {
      de: 'gutten tag'
    }
  }

  const case1 = '{{en}}'
  const case2 = {
    nested: {
      key: '{{sv}}'
    }
  }
  const case3 = [
    {
      nested: {
        key: '{{es}}'
      }
    }
  ]
  const case4 = {
    notSoNested: '{{fr}}'
  }
  const case5 = ['{{nested.de}}']

  expect(renderRecursive(case1, ctx)).toEqual(ctx.en)
  expect(renderRecursive(case2, ctx).nested.key).toEqual(ctx.sv)
  expect(renderRecursive(case3, ctx)[0].nested.key).toEqual(ctx.es)
  expect(renderRecursive(case4, ctx).notSoNested).toEqual(ctx.fr)
  expect(renderRecursive(case5, ctx)[0]).toEqual(ctx.nested.de)
})

const ctx = {
  event: {
    id: 123456
  }
}

const case1 = {
  text: {
    en: 'Hey there {{event.id}}',
    fr: 'Salut {{event.id}}'
  },
  typing: true
}

test('Rendering with a specific language', () => {
  expect(renderRecursive(case1, ctx, 'en', 'fr')).toEqual({ text: 'Hey there 123456', typing: true })
  expect(renderRecursive(case1, ctx, '', 'fr')).toEqual({ text: 'Salut 123456', typing: true })
})

test('Rendering without any language', () => {
  expect(renderRecursive(case1, ctx, '', '')).toEqual({
    text: { en: 'Hey there 123456', fr: 'Salut 123456' },
    typing: true
  })
  expect(renderRecursive(case1, ctx)).toEqual({
    text: { en: 'Hey there 123456', fr: 'Salut 123456' },
    typing: true
  })
})

test('Rendering a nested & translated template', () => {
  const nested = {
    items: [
      {
        title: {
          fr: 'un titre',
          en: 'one title'
        },
        actions: [
          {
            title: {
              fr: 'dire',
              en: 'say'
            },
            action: 'Say something',
            text: {
              fr: 'salut {{event.id}}',
              en: 'hey {{event.id}}'
            }
          }
        ]
      }
    ]
  }

  expect(renderRecursive(nested, ctx, 'en', 'fr')).toEqual({
    items: [{ title: 'one title', actions: [{ title: 'say', action: 'Say something', text: 'hey 123456' }] }]
  })
})
