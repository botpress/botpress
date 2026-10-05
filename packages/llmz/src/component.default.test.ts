import { describe, expect, it } from 'vitest'
import { DefaultComponents } from './component.default.js'

describe('default carousel', () => {
  it.each([
    {},
    { cards: [] },
    { cards: [{ body: 'Missing title' }] },
    { cards: Array.from({ length: 11 }, () => ({ title: 'Too many' })) },
    { cards: [{ title: 'Too many buttons', buttons: Array.from({ length: 6 }, () => ({ label: 'Choice' })) }] },
  ])('rejects invalid card data: %j', (props) => {
    expect(() => DefaultComponents.Carousel.render(props)).toThrow()
  })

  it('preserves direct rendering of existing nested card children', () => {
    const card = DefaultComponents.Card.render({ title: 'Existing card' }, ['Description'])
    expect(DefaultComponents.Carousel.render({}, [card]).children).toEqual([card])
    expect(() => DefaultComponents.Carousel.render({}, ['A Markdown list is not a carousel'])).toThrow()
  })
})
