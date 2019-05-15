import { configure } from 'mobx'
import { Provider } from 'mobx-react'
import DevTools from 'mobx-react-devtools'
import React from 'react'

import Chat from './main'
import { RootStore } from './store'

configure({ enforceActions: 'observed' })

export const Embedded = props => WebChat(props, false)
export const Fullscreen = props => WebChat(props, true)

const WebChat = (props, fullscreen) => (
  <Provider store={new RootStore({ fullscreen })}>
    <React.Fragment>
      <Chat {...props} fullscreen={fullscreen} />
      <DevTools />
    </React.Fragment>
  </Provider>
)

/**
 * @deprecated Since the way views are handled has changed, we're also exporting views in lowercase.
 * https://botpress.io/docs/developers/migrate/
 */
export { Embedded as embedded } from '.'
export { Fullscreen as fullscreen } from '.'

export {
  Carousel,
  QuickReplies,
  LoginPrompt,
  Text,
  FileMessage,
  FileInput,
  Button
} from './components/messages/renderer'
