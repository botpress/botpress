import reactor from '~/reactor'
import axios from 'axios'

import actionTypes from './actionTypes'
const { MODULES_RECEIVED } = actionTypes

export default {
  fetchModules() {
    axios.get('/api/modules')
    .then((result) => {
      reactor.dispatch(MODULES_RECEIVED, { modules: result.data })
    })
  }
}
