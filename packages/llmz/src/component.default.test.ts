import { describe, expect, it } from 'vitest'
import { DefaultComponents } from './component.default.js'

describe('default components', () => {
  it('includes only components for rich messages', () => {
    expect(Object.keys(DefaultComponents)).toEqual(['Button', 'Image', 'File', 'Video', 'Audio', 'Card', 'Carousel'])
  })

  it('renders a card entirely from props and applies nested defaults', () => {
    const card = DefaultComponents.Card.render({
      title: 'Standard plan',
      subtitle: '$20/month',
      text: '**Five projects** and email support.',
      image: { url: 'https://example.com/standard.png', alt: 'Standard plan' },
      buttons: [{ label: 'Choose Standard' }],
    })

    expect(card).toEqual({
      type: 'component',
      name: 'Card',
      props: {
        title: 'Standard plan',
        subtitle: '$20/month',
        text: '**Five projects** and email support.',
        image: { url: 'https://example.com/standard.png', alt: 'Standard plan' },
        buttons: [{ action: 'say', label: 'Choose Standard' }],
      },
    })
  })

  it('uses the same card props in carousels without creating child components', () => {
    const cards = [
      { title: 'Standard', text: 'Five projects.', buttons: [{ label: 'Choose' }] },
      { title: 'Team', text: 'Twenty projects.' },
    ]
    const carousel = DefaultComponents.Carousel.render({ cards })

    expect(carousel).toEqual({
      type: 'component',
      name: 'Carousel',
      props: { cards: cards.map((props) => DefaultComponents.Card.render(props).props) },
    })
    expect(carousel).not.toHaveProperty('children')
    expect(carousel).not.toHaveProperty('__jsx')
  })

  it.each([
    {},
    { cards: [] },
    { cards: [{ text: 'Missing title' }] },
    { cards: Array.from({ length: 11 }, () => ({ title: 'Too many' })) },
    { cards: [{ title: 'Too many buttons', buttons: Array.from({ length: 6 }, () => ({ label: 'Choice' })) }] },
    { cards: [{ title: 'Legacy body', body: 'Unsupported' }] },
    { cards: [{ title: 'Legacy children', children: ['Unsupported'] }] },
  ])('rejects invalid card data: %j', (props) => {
    expect(() => DefaultComponents.Carousel.render(props as never)).toThrow()
  })

  it('allows cards containing only a title', () => {
    expect(DefaultComponents.Card.render({ title: 'Reminder' })).toEqual({
      type: 'component',
      name: 'Card',
      props: { title: 'Reminder' },
    })
  })
})
