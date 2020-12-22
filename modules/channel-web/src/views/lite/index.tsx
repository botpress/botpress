import '@blueprintjs/core/lib/css/blueprint.css'
import { configure } from 'mobx'
import { inject, observer, Provider } from 'mobx-react'
import React from 'react'
import { IntlProvider } from 'react-intl'

import Chat from './main'
import { RootStore } from './store'
import { defaultLocale, translations } from './translations'
configure({ enforceActions: 'observed' })

export const Embedded = props => new Wrapper(props, false)
export const Fullscreen = props => new Wrapper(props, true)

interface State {
  fullscreen: any
  store: any
}

interface Props {}

class ExposedWebChat extends React.Component<Props, State> {
  constructor(props, fullscreen) {
    super(props)

    this.state = {
      fullscreen,
      store: new RootStore({ fullscreen })
    }
  }

  render() {
    const { fullscreen } = this.state
    const store = this.state.store
    const { botUILanguage: locale } = store

    return (
      <Provider store={store}>
        <IntlProvider locale={locale} messages={translations[locale]} defaultLocale={defaultLocale}>
          <React.Fragment>
            <Chat {...this.props} />
          </React.Fragment>
        </IntlProvider>
      </Provider>
    )
  }
}

const Wrapper = observer(ExposedWebChat)

/**
 * @deprecated Since the way views are handled has changed, we're also exporting views in lowercase.
 * https://botpress.com/docs/developers/migrate/
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
