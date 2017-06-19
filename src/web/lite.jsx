import React from 'expose?React!react'
import ReactDOM from 'expose?ReactDOM!react-dom'

import InjectedModuleView from '~/components/PluginInjectionSite/module'

console.log(window.location)

const moduleName = 'botpress-messenger-views'
const subView = 'hello.bundle'

const LiteView = props => {
  const moduleView = <InjectedModuleView
    moduleName={moduleName}
    viewName={subView}
    lite={true}
    onNotFound={() => {
      console.log('View NOT FOUND')
    }} />

  return moduleView
}

ReactDOM.render(<LiteView />, document.getElementById('app'))
