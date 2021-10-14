/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Message } from 'typings'
import defaultRenderer, { defaultMessageConfig, defaultTypesRenderers, Renderer, renderMessage } from './'

describe('Unsupported type renderer', () => {})

describe('Renderer', () => {
  test('it can override a type handler and render it', () => {
    const customRenderer = new Renderer()
    customRenderer.register(defaultTypesRenderers)
    customRenderer.add('custom', ({ payload }) => (
      <div>
        Custom {payload.module} {payload.component}
      </div>
    ))
    const component = renderMessage(
      { type: 'custom', payload: { module: 'test', component: 'test' }, config: defaultMessageConfig },
      customRenderer
    )

    expect(component).toBeTruthy()
    render(component)
    expect(screen.getByText('Custom test test')).toBeInTheDocument()
  })

  test('it can get the valid default text component', () => {
    const textRenderer = defaultRenderer.get('text')

    expect(textRenderer).toBeTruthy()

    const reactEl = React.createElement(textRenderer, {
      type: 'text',
      payload: { text: 'test', markdown: false },
      config: defaultMessageConfig
    })

    render(reactEl)

    expect(screen.getByText('test')).toBeInTheDocument()
  })

  test('it renders "unsupported message type" message on non-existant types', () => {
    const nonExistantType = 'non-existant'
    const component = renderMessage({ type: nonExistantType, payload: {}, config: defaultMessageConfig } as Message<
      any
    >)
    expect(component).toBeTruthy()
    render(component)
    expect(screen.getByText(`Unsupported message type: ${nonExistantType}`)).toBeInTheDocument()
  })

  test('it can render custom types', () => {
    const customRenderer = new Renderer()

    customRenderer.register(defaultTypesRenderers)

    customRenderer.add<'custom_type'>('custom_type', ({ payload }) => <div>Your emoji: {payload.emoji}</div>)

    const message = '🐳'
    const component = renderMessage(
      {
        type: 'custom_type',
        payload: {
          emoji: message
        },
        config: defaultMessageConfig
      },
      customRenderer
    )

    expect(component).toBeTruthy()
    render(component)
    expect(screen.getByText(`Your emoji: ${message}`)).toBeInTheDocument()
  })
})
