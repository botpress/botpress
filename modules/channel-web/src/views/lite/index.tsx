import { configure } from 'mobx'
import { Provider } from 'mobx-react'
import DevTools from 'mobx-react-devtools'
import React from 'react'
import { IntlProvider } from 'react-intl'

import Chat from './main'
import { RootStore } from './store'
import { availableLocale, defaultLocale, getUserLocale, initializeLocale, translations } from './translations'
configure({ enforceActions: 'observed' })

export const Embedded = props => WebChat(props, false)
export const Fullscreen = props => WebChat(props, true)

initializeLocale()
const locale = getUserLocale(availableLocale, defaultLocale)

const WebChat = (props, fullscreen) => (
  <IntlProvider locale={locale} messages={translations[locale]} defaultLocale={defaultLocale}>
    <Provider store={new RootStore({ fullscreen })}>
      <React.Fragment>
        <Chat {...props} />
        {process.env.NODE_ENV === 'development' && <DevTools className="bpw-mobx-tools" />}
      </React.Fragment>
    </Provider>
  </IntlProvider>
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
