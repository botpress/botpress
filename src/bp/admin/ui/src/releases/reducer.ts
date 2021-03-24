import axios from 'axios'
import _ from 'lodash'
import moment from 'moment'
import api from '~/app/api'
import { AppThunk } from '~/app/rootReducer'

interface GithubRelease {
  version: string
  details: string
  githubUrl: string
  releaseDate: Date
  daysAgo: string
  dockerUrl: string
}

interface VersionState {
  currentVersion: string
  latestReleases: GithubRelease[]
}

const RECEIVE_CURRENT_VERSION = 'version/RECEIVE_CURRENT_VERSION'
const RECEIVE_LATEST_RELEASES = 'version/RECEIVE_LATEST_RELEASES'

const initialState: VersionState = {
  currentVersion: '',
  latestReleases: []
}

export default (state = initialState, action): VersionState => {
  switch (action.type) {
    case RECEIVE_LATEST_RELEASES:
      return {
        ...state,
        latestReleases: action.payload.releases
      }
    case RECEIVE_CURRENT_VERSION:
      return {
        ...state,
        currentVersion: action.payload.version
      }
    default:
      return state
  }
}

export const fetchCurrentVersion = (): AppThunk => {
  return async dispatch => {
    try {
      const { data } = await axios.get('/version', { baseURL: process.env.REACT_APP_API_URL })
      dispatch({
        type: RECEIVE_CURRENT_VERSION,
        payload: { version: data }
      })
    } catch (err) {
      console.error('could not fetch current version')
    }
  }
}

export const fetchLatestVersions = (): AppThunk => {
  return async (dispatch, getState) => {
    if (getState().version.latestReleases.length !== 0) {
      return
    }

    try {
      const { data } = await axios.get('https://api.github.com/repos/botpress/botpress/releases')
      const releases = _.take(data, 5).map((x: any) => ({
        version: x.name.startsWith('v') ? x.name.slice(1) : x.name,
        details: x.body,
        githubUrl: x.html_url,
        releaseDate: x.created_at,
        daysAgo: moment(x.created_at).fromNow(),
        dockerUrl: ''
      }))

      try {
        const { data } = await api.getSecured().get('/admin/docker_images')

        const dockerInfo = data.results.map(result => ({
          name: result.name,
          version: result.name.slice(1).replace(/_/g, '.'),
          hash: result.images[0].digest.replace(/\:/g, '-')
        }))

        releases.forEach(r => {
          const details = dockerInfo.find(x => x.version === r.version)
          if (details) {
            r.dockerUrl = `https://hub.docker.com/layers/botpress/server/${details.name}/images/${details.hash}`
          }
        })
      } catch (err) {
        console.error('could not fetch docker image information', err)
      }

      dispatch({
        type: RECEIVE_LATEST_RELEASES,
        payload: { releases }
      })
    } catch (err) {
      console.error('could not fetch current version')
    }
  }
}
