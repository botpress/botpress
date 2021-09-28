/**
 * @jest-environment jsdom
 */
import './mocks/matchMedia.mock' // required by react-slick
import { render, screen } from '@testing-library/react'
import React, { ReactElement } from 'react'
import { defaultMessageConfig, renderMessage, MessageType } from './renderer/render'

describe('Text renderer', () => {
  test('renders a simple text message', () => {
    const text = 'Hello World!'
    const messageComponent = renderMessage({
      type: 'text',
      payload: {
        text,
        markdown: false
      },
      config: defaultMessageConfig
    })
    expect(messageComponent).toBeTruthy()
    render(messageComponent as ReactElement)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  test('renders a simple markdown message', () => {
    const text = '**Hello** *World*! go check out [botpress](https://botpress.com)'

    const component = renderMessage({
      type: 'text',
      payload: {
        text,
        markdown: true
      },
      config: defaultMessageConfig
    })

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

describe('File renderer', () => {
  test('renders a video file as video player', () => {
    const url = 'http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4'
    const component = renderMessage({
      type: 'file',
      payload: { file: { url } },
      config: defaultMessageConfig
    })

    expect(component).toBeTruthy()
    const { container } = render(component as ReactElement)

    const el = container.querySelector('video')
    const src = container.querySelector('video source')
    expect(el).toBeInTheDocument()
    expect(el?.hasAttribute('controls')).toBe(true)

    expect(src).toBeInTheDocument()
    expect(src?.getAttribute('src')).toBe(url)
    expect(src?.getAttribute('type')).toBe('video/mp4')
  })

  test('renders an image file as image', () => {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/9/90/Touched_by_His_Noodly_Appendage_HD.jpg'
    const component = renderMessage({
      type: 'file' as MessageType,
      payload: { file: { url } },
      config: defaultMessageConfig
    })

    expect(component).toBeTruthy()
    const { container } = render(component as ReactElement)

    const el = container.querySelector('img')

    expect(el).toBeInTheDocument()
    expect(el?.getAttribute('src')).toBe(url)
  })

  test('renders a video player with title and text', () => {
    const url = 'http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4'
    const messageData = {
      type: 'file' as MessageType,
      payload: { file: { url, title: 'Hello Video', storage: 'remote' } },
      config: defaultMessageConfig
    }

    const component = renderMessage(messageData)

    expect(component).toBeTruthy()
    const { container } = render(component as ReactElement)

    const el = container.querySelector('video')
    const src = container.querySelector('video source')
    expect(el).toBeInTheDocument()
    expect(el?.hasAttribute('controls')).toBe(true)

    expect(src).toBeInTheDocument()
    expect(src?.getAttribute('src')).toBe(url)
    expect(src?.getAttribute('type')).toBe('video/mp4')
  })
})

describe('Unsupported type renderer', () => {
  test('renders unsupported message type message', () => {
    const component = renderMessage({ type: 'custom', payload: {}, config: defaultMessageConfig })
    expect(component).toBeTruthy()
    render(component as ReactElement)
    expect(screen.getByText('* Unsupported message type *')).toBeInTheDocument()
  })
})
