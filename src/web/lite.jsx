import React from 'react'
import ReactDOM from 'react-dom'

import InjectedModuleView from '~/components/PluginInjectionSite/module'

const parseQueryString = () => {
  const queryString = (window.location.search || '').substring(1) || ''

  const params = {}
  const queries = queryString.split('&')

  for (let i = 0, l = queries.length; i < l; i++) {
    const temp = queries[i].split('=')
    params[temp[0]] = temp[1]
  }
  return params
}

const { m, v } = parseQueryString()

const LiteView = props => {
  return (
    <InjectedModuleView
      moduleName={m}
      viewName={v}
      lite={true}
      onNotFound={() => (
        <h1>
          Module ${m} with view ${v} not found
        </h1>
      )}
    />
  )
}

ReactDOM.render(<LiteView />, document.getElementById('app'))
