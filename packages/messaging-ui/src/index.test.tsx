/**
 * @jest-environment jsdom
 */
import { fireEvent, prettyDOM, render, screen } from '@testing-library/react'
import { ReactElement } from 'react'
import { Message, MessageType } from 'typings'
import { defaultMessageConfig, renderMessage } from './'

describe('Unsupported type renderer', () => {
  test('it renders unsupported message type message', () => {
    const component = renderMessage({ type: 'custom', payload: {}, config: defaultMessageConfig } as Message<'custom'>)
    expect(component).toBeTruthy()
    render(component as ReactElement)
    expect(screen.getByText('* Unsupported message type *')).toBeInTheDocument()
  })
})
