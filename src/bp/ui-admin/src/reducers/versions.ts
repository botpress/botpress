import axios from 'axios'
import _ from 'lodash'
import moment from 'moment'
import api from '~/api'

interface GithubRelease {
  version: string
  details: string
  githubUrl: string
  releaseDate: Date
  daysAgo: string
}

export interface VersionState {
  currentVersion: string
  latestReleases: GithubRelease[]
}

const RECEIVE_CURRENT_VERSION = 'version/RECEIVE_CURRENT_VERSION'
const RECEIVE_LATEST_RELEASES = 'version/RECEIVE_LATEST_RELEASES'

export const fetchCurrentVersion = () => {
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

export const fetchLatestVersions = () => {
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
        const { data } = await api.getSecured().get('/admin/versioning/docker_images')
        _.forEach(releases, x => {
          _.forEach(data.results, r => {
            const version = x.version.replace(/\./g, '_')
            if (r.name.slice(1) === version) {
              const digest = r.images[0].digest.replace(/\:/g, '-')
              x.dockerUrl = `https://hub.docker.com/layers/botpress/server/v${version}/images/${digest}`
            }
          })
        })
      } catch (err) {
        console.error('could not fetch docker image information')
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

const initialState = { currentVersion: '', latestReleases: [] }

export default (state: VersionState = initialState, action) => {
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
