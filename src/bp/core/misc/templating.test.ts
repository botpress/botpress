import { renderRecursive } from './templating'

test('renderRecursive', () => {
  const ctx = {
    en: 'hello',
    sv: 'hejhej',
    es: 'hola',
    fr: 'bonjour',
    nested: {
      de: 'gutten tag'
    },
    unsafe: '<a>lol</a>'
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
  const case6 = '{{{unsafe}}}'
  const case7 = '{{&unsafe}}'

  expect(renderRecursive(case1, ctx)).toEqual(ctx.en)
  expect(renderRecursive(case2, ctx).nested.key).toEqual(ctx.sv)
  expect(renderRecursive(case3, ctx)[0].nested.key).toEqual(ctx.es)
  expect(renderRecursive(case4, ctx).notSoNested).toEqual(ctx.fr)
  expect(renderRecursive(case5, ctx)[0]).toEqual(ctx.nested.de)
  expect(renderRecursive(case6, ctx)).not.toEqual(ctx.unsafe)
  expect(renderRecursive(case6, ctx, true)).not.toEqual(ctx.unsafe)
  expect(renderRecursive(case6, ctx, false)).toEqual(ctx.unsafe)
  expect(renderRecursive(case7, ctx)).not.toEqual(ctx.unsafe)
  expect(renderRecursive(case7, ctx, true)).not.toEqual(ctx.unsafe)
  expect(renderRecursive(case7, ctx, false)).toEqual(ctx.unsafe)
})
