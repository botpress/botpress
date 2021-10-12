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

  test('it renders "unsupported message type" message on non-existant types', () => {
    const component = renderMessage({ type: 'thisdoesntexist', payload: {}, config: defaultMessageConfig } as Message<
      any
    >)
    expect(component).toBeTruthy()
    render(component)
    expect(screen.getByText('Unsupported message type:')).toBeInTheDocument()
  })

  test('it can render custom types', () => {
    const customRenderer = new Renderer()

    const message = '🐳'

    customRenderer.register(defaultTypesRenderers)
    customRenderer.add('emoji', ({ payload }) => <div>Your emoji: {payload.message}</div>)
    const component = renderMessage(
      {
        type: 'emoji',
        payload: {
          emoji: message
        },
        config: defaultMessageConfig
      },
      customRenderer
    )

    expect(component).toBeTruthy()
    render(component)
    expect(screen.getByText('Custom test test')).toBeInTheDocument()
  })
})
