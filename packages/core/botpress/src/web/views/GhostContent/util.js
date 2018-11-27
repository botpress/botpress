import axios from 'axios'
import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import mapValues from 'lodash/mapValues'

import { downloadBlob } from '~/util'

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

export const revertPendingFileChangesXX = data => {
  const reqData = { filePath: data.path, revision: data.revision }
  return axios.post('/api/versioning/revert', reqData).then()
}

export const exportArchiveXX = async () => {
  const res = await axios.get('/api/versioning/export', { responseType: 'blob' })
  let name = get(res, 'headers.content-disposition', 'archive.tgz')
  if (name.includes('filename=')) {
    name = name.substr(name.indexOf('filename=') + 'filename='.length)
  }

  downloadBlob(name, res.data)
}
