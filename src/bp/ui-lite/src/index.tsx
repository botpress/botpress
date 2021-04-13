import 'babel-polyfill'
import axios from 'axios'
import { CSRF_TOKEN_HEADER } from 'common/auth'
import queryString from 'query-string'
import React from 'react'
import ReactDOM from 'react-dom'

import { getToken } from '../../ui-shared-lite/auth'
import InjectedModuleView from './InjectedModuleView'

const token = getToken()
if (token) {
  if (window.USE_JWT_COOKIES) {
    axios.defaults.headers.common[CSRF_TOKEN_HEADER] = token
  } else {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  axios.defaults.headers.common['X-BP-Workspace'] = window.WORKSPACE_ID
}

const { m, v } = queryString.parse(location.search)

const alternateModuleNames = {
  'platform-webchat': 'channel-web'
}
const moduleName = alternateModuleNames[m] || m

class LiteView extends React.Component {
  render() {
    const onNotFound = () => (
      <h1>
        Module ${moduleName} with view ${v} not found
      </h1>
    )

    return (
      <div>
        <InjectedModuleView moduleName={moduleName} lite={true} componentName={v} onNotFound={onNotFound} />
      </div>
    )
  }
}

ReactDOM.render(<LiteView />, document.getElementById('app'))
