import axios from 'axios'

import groupBy from 'lodash/groupBy'
import mapValues from 'lodash/mapValues'

const transformData = data => mapValues(data, entries => groupBy(entries, 'file'))

export const fetchStatus = () =>
  axios.get('/api/ghost_content/status').then(({ data }) => {
    return transformData(data)
  })

export const getHost = () => {
  const { protocol, host } = document.location
  return `${protocol}//${host}`
}

export const revertPendingFileChanges = (folder, file) =>
  axios.delete(`/api/ghost_content/${folder}`, { params: { file } }).then()
