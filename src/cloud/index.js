import fs from 'fs'
import path from 'path'
import axios from 'axios'
import ms from 'ms'

module.exports = ({ projectLocation }) => {
  let certificate = null
  setInterval(() => (certificate = null), ms('5 minutes'))

  function _readCloudfile() {
    const filePath = path.resolve(projectLocation, 'bp-cloud.json')
    if (!fs.existsSync(filePath)) {
      throw new Error(
        'Could not find `bp-cloud.json` file at project root. Have you run "botpress cloud-pair" command?'
      )
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  }

  function getCloudEndpoint() {
    return _readCloudfile().endpoint
  }

  async function _getWellKnownRSACert() {
    if (certificate) {
      return certificate
    }

    const endpoint = getCloudEndpoint()
    const { data } = await axios.get(endpoint + '/api/.well-known/public.key')

    if (data && data.length) {
      certificate = data
    }

    return data
  }

  function _getRemoteRoles() {}
  function getUserRoles() {}

  return { getCloudEndpoint, getCertificate: _getWellKnownRSACert }
}
