import 'babel-polyfill'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'

import InjectedModuleView from '~/components/PluginInjectionSite/module'

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

function parseQueryString() {
  let queryString = window.location.search || '?'
  queryString = queryString.substring(1)

  let params = {},
    queries,
    temp,
    i,
    l
  queries = queryString.split('&')

  for (i = 0, l = queries.length; i < l; i++) {
    temp = queries[i].split('=')
    params[temp[0]] = temp[1]
  }
  return params
}
