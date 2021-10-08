/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { ReactElement } from 'react'
import { defaultMessageConfig, renderMessage } from '../'
import { Message } from '../typings'

describe('Text renderer', () => {
  test('it renders a simple text message', () => {
    const text = 'Hello World!'
    const messageComponent = renderMessage({
      type: 'text',
      payload: {
        text,
        markdown: false
      },
      config: defaultMessageConfig
    } as Message<'text'>)
    expect(messageComponent).toBeTruthy()
    render(messageComponent as ReactElement)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  test('it renders clickable links in a non-markdown text message', () => {
    const text = 'Please go check out botpress.com'
    const messageComponent = renderMessage({
      type: 'text',
      payload: {
        text,
        markdown: false
      },
      config: defaultMessageConfig
    } as Message<'text'>)
    expect(messageComponent).toBeTruthy()
    render(messageComponent as ReactElement)
    const anchor = screen.getByText('botpress.com')
    expect(anchor.tagName).toBe('A')
    expect(anchor.getAttribute('href')).toBe('http://botpress.com')
    expect(anchor.getAttribute('target')).toBe('_blank')
  })

  test('it renders a markdown message', () => {
    const text = '**Hello** *World*! go check out [botpress](https://botpress.com)'

    const component = renderMessage({
      type: 'text',
      payload: {
        text,
        markdown: true
      },
      config: defaultMessageConfig
    } as Message<'text'>)

    expect(component).toBeTruthy()
    render(component as ReactElement)

    const italicElement = screen.getByText('World')
    const boldElement = screen.getByText('Hello')
    const linkElement = screen.getByText('botpress')

    expect(italicElement.tagName).toBe('EM')
    expect(boldElement.tagName).toBe('STRONG')
    expect(linkElement.tagName).toBe('A')
    expect(linkElement.getAttribute('href')).toBe('https://botpress.com')
    expect(linkElement.getAttribute('target')).toBe('_blank')
  })
})
