/**
 * @jest-environment jsdom
 */
import './mocks/matchMedia.mock' // required by react-slick
import { render, screen } from '@testing-library/react'
import React from 'react'
import ReactDOM from 'react-dom'
import { Text } from './renderer'

test('renders a simple text message', () => {
  render(<Text escapeHTML={false} text="Hello world" markdown={false} />)
  expect(screen.getByText('Hello world')).toBeInTheDocument()
})

const incomingSampleEvent = {
  type: 'text',
  channel: 'web',
  direction: 'incoming',
  payload: {
    type: 'text',
    text: 't'
  },
  target: 'S-0x373utfUNguZ6ZR1NWE0U',
  botId: 'test',
  createdOn: '2021-09-17T18:18:25.845Z',
  threadId: '1',
  id: '51576822704569484',
  preview: 't',
  flags: {},
  state: {
    __stacktrace: [
      {
        flow: 'main.flow.json',
        node: 'entry'
      },
      {
        flow: 'main.flow.json',
        node: 'none_message'
      }
    ],
    user: {
      timezone: -3,
      language: 'en'
    },
    context: {},
    session: {
      lastMessages: [
        {
          eventId: '51576822704569484',
          incomingPreview: 't',
          replyConfidence: 1,
          replySource: 'dialogManager',
          replyDate: '2021-09-17T18:18:26.706Z',
          replyPreview: '#!builtin_text-iVBzXn'
        }
      ],
      workflows: {},
      slots: {}
    },
    temp: {}
  },
  suggestions: [],
  nlu: {
    entities: [],
    language: 'en',
    detectedLanguage: 'n/a',
    spellChecked: 't',
    ambiguous: false,
    slots: {},
    intent: {
      name: 'none',
      confidence: 0.502,
      context: 'global'
    },
    intents: [
      {
        name: 'none',
        context: 'global',
        confidence: 0.502
      }
    ],
    errored: false,
    includedContexts: ['global'],
    ms: 273,
    predictions: {
      global: {
        confidence: 1,
        oos: 0.9489441927576394,
        intents: [
          {
            extractor: 'svm-classifier',
            label: 'none',
            confidence: 0.9423240905902893,
            slots: {}
          },
          {
            extractor: 'svm-classifier',
            label: '__qna__rkmsylph53_hello',
            confidence: 0.011138941789375401,
            slots: {}
          }
        ]
      }
    }
  },
  processing: {},
  activeProcessing: {},
  decision: {
    decision: {
      reason: 'no suggestion matched',
      status: 'elected'
    },
    confidence: 1,
    payloads: [],
    source: 'decisionEngine',
    sourceDetails: 'execute default flow'
  }
}

const exampleOutgoingEvent = {
  type: 'text',
  channel: 'web',
  direction: 'outgoing',
  payload: {
    type: 'text',
    text: "Pardon, je n'ai pas compris. Veuillez me poser un autre question."
  },
  target: 'S-0x373utfUNguZ6ZR1NWE0U',
  botId: 'test',
  createdOn: '2021-09-17T18:18:26.717Z',
  threadId: '1',
  id: '51577694316769179',
  preview: "Pardon, je n'ai pas compris. Veuillez me poser un autre question.",
  flags: {},
  incomingEventId: '51576822704569484',
  nlu: {
    entities: [],
    language: 'n/a',
    ambiguous: false,
    slots: {},
    intent: {
      name: 'none',
      confidence: 1,
      context: 'global'
    },
    intents: [],
    errored: false,
    includedContexts: ['global'],
    ms: 0
  }
}
