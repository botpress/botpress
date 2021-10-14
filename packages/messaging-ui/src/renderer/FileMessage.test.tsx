/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { Message } from 'typings'
import { defaultMessageConfig, renderMessage } from '../'

describe('File renderer', () => {
  test('it renders a file of unsupported mime type as a download link', () => {
    const url = 'http://example.org/file.txt'
    const component = renderMessage({
      type: 'file',
      payload: { file: { url } },
      config: defaultMessageConfig
    })

    expect(component).toBeTruthy()

    const { container } = render(component)
    const linkElement = container.querySelector('a')
    expect(linkElement).toBeTruthy()
    expect(linkElement?.href).toBe(url)
  })

  test('it renders a file of unknown mime type as a download link', () => {
    const url = 'http://example.org/file.ifThisMimeTypeExistsSwitchCareers'
    const component = renderMessage({
      type: 'file',
      payload: { file: { url } },
      config: defaultMessageConfig
    })

    expect(component).toBeTruthy()

    const { container } = render(component)
    const linkElement = container.querySelector('a')
    expect(linkElement).toBeTruthy()
    expect(linkElement?.href).toBe(url)
  })

  test('it renders a video file as video player with controls', () => {
    const url = 'http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4'
    const component = renderMessage({
      type: 'file',
      payload: { file: { url } },
      config: defaultMessageConfig
    })

    expect(component).toBeTruthy()
    const { container } = render(component)

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
      payload: {
        file: {
          url
        }
      },
      config: defaultMessageConfig
    })

    expect(component).toBeTruthy()
    const { container } = render(component)

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
    const { container } = render(component)

    const el = container.querySelector('video')
    const src = container.querySelector('video source')
    expect(el).toBeInTheDocument()
    expect(el?.hasAttribute('controls')).toBe(true)

    expect(src).toBeInTheDocument()
    expect(src?.getAttribute('src')).toBe(url)
    expect(src?.getAttribute('type')).toBe('video/mp4')
  })
})
