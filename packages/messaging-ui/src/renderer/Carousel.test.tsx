/**
 * @jest-environment jsdom
 */

import { fireEvent, render } from '@testing-library/react'
import { ReactElement } from 'react'
import { Message } from 'typings'
import { defaultMessageConfig, renderMessage } from '../'

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

    const { container } = render(component)

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

    const { container } = render(component)

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

    const { container } = render(component)

    const btnEl = container.querySelector('.bpw-card-action')

    expect(btnEl).toHaveAttribute('href', urlBtnMessageData.payload.carousel.elements[0].buttons[0].url)
    expect(btnEl).toHaveAttribute('target', '_blank')
  })
})
