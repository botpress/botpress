/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { Message } from 'typings'
import { defaultMessageConfig, renderMessage } from '../'

describe('VoiceMessage', () => {
  test('It renders a simple html audio element with controls', () => {
    const message: Message<'voice'> = {
      type: 'voice',
      payload: { file: { audio: 'http://example.org/sample.mp3', autoPlay: false }, shouldPlay: true },
      config: defaultMessageConfig
    }

    const messageEl = renderMessage(message)
    expect(messageEl).toBeTruthy()

    const { container } = render(messageEl)

    const audioEl = container.getElementsByTagName('audio')[0]
    const sourceEl = container.getElementsByTagName('source')[0]

    expect(sourceEl).toHaveAttribute('src', message.payload.file.audio)
    expect(audioEl).toHaveAttribute('controls')
    expect(sourceEl).toHaveAttribute('type', 'audio/mpeg')
  })
})
