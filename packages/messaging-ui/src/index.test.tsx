/**
 * @jest-environment jsdom
 */
import './mocks/matchMedia.mock' // required by react-slick
import { fireEvent, prettyDOM, render, screen } from '@testing-library/react'
import React, { ReactElement } from 'react'
import { Message, MessageType } from 'typings'
import { defaultMessageConfig, renderMessage } from './'

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

describe('File renderer', () => {
  test('it renders a video file as video player with controls', () => {
    const url = 'http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4'
    const component = renderMessage({
      type: 'file',
      payload: { file: { url } },
      config: defaultMessageConfig
    } as Message<'file'>)

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

  test('it renders an image file as image', () => {
    const url = 'https://upload.wikimedia.org/wikipedia/commons/9/90/Touched_by_His_Noodly_Appendage_HD.jpg'
    const component = renderMessage({
      type: 'file',
      payload: { file: { url } },
      config: defaultMessageConfig
    } as Message<'file'>)

    expect(component).toBeTruthy()
    const { container } = render(component as ReactElement)

    const el = container.querySelector('img')

    expect(el).toBeInTheDocument()
    expect(el?.getAttribute('src')).toBe(url)
  })

  test('it renders a video player with title and text', () => {
    const url = 'http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4'
    const messageData: Message<'file'> = {
      type: 'file',
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

describe('Carousel & Card renderer', () => {
  const messageData: Message<'carousel'> = {
    type: 'carousel',
    payload: {
      carousel: {
        elements: [
          {
            title: 'Card 1',
            subtitle: 'Subtitle 1',
            picture: 'https://via.placeholder.com/150/150',
            buttons: [
              {
                title: 'Button 1',
                type: 'postback',
                payload: { data: 'button_clicked' }
              }
            ]
          }
        ]
      }
    },
    config: defaultMessageConfig
  }

  test('it renders a single card with image, title, subtitle and button', () => {
    const card = messageData.payload.carousel.elements[0]
    const component = renderMessage(messageData)

    expect(component).toBeTruthy()

    const { container } = render(component as ReactElement)

    expect(container.querySelector('.slick-slider')).toBeInTheDocument()
    expect(container.querySelector('.bpw-card-picture')).toHaveStyle(`background-image: url(${card.picture})`)
    expect(container.querySelector('.bpw-card-title')).toHaveTextContent(card.title)
    expect(container.querySelector('.bpw-card-subtitle')).toHaveTextContent(card.subtitle)

    const btnEl = container.querySelector('.bpw-card-action')
    expect(btnEl).toHaveTextContent(card.buttons[0].title)
  })

  test('it calls onSendData with postback payload on postback button click', () => {
    const card = messageData.payload.carousel.elements[0]

    const mockOnSendData = jest.fn()
    const component = renderMessage({ ...messageData, config: { ...defaultMessageConfig, onSendData: mockOnSendData } })

    const { container } = render(component as ReactElement)

    const btnEl = container.querySelector('.bpw-card-action')

    fireEvent.click(btnEl!)
    expect(mockOnSendData).toHaveBeenCalledWith({ payload: card.buttons[0].payload, type: card.buttons[0].type })
  })

  test('it shows a link button for URL buttons', () => {
    const urlBtnMessageData: Message<'carousel'> = {
      type: 'carousel',
      payload: {
        carousel: {
          elements: [
            {
              title: 'Card 1',
              subtitle: 'Subtitle 1',
              picture: 'https://via.placeholder.com/150/150',
              buttons: [
                {
                  title: 'Button 1',
                  url: 'https://botpress.com'
                }
              ]
            }
          ]
        }
      },
      config: defaultMessageConfig
    }
    const component = renderMessage(urlBtnMessageData)

    const { container } = render(component as ReactElement)

    const btnEl = container.querySelector('.bpw-card-action')
    expect(btnEl).toHaveAttribute('href', urlBtnMessageData.payload.carousel.elements[0].buttons[0].url)
  })
})

describe('Unsupported type renderer', () => {
  test('it renders unsupported message type message', () => {
    const component = renderMessage({ type: 'custom', payload: {}, config: defaultMessageConfig } as Message<'custom'>)
    expect(component).toBeTruthy()
    render(component as ReactElement)
    expect(screen.getByText('* Unsupported message type *')).toBeInTheDocument()
  })
})
