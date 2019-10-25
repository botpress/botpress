import axios from 'axios'
import _ from 'lodash'
import moment from 'moment'

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

const RECEIVE_CURRENT_VERSON = 'version/RECEIVE_CURRENT_VERSON'
const RECEIVE_LATEST_RELEASES = 'version/RECEIVE_LATEST_RELEASES'

export const fetchCurrentVersion = () => {
  return async (dispatch, getState) => {
    if (getState().version.currentVersion) {
      return
    }

    try {
      const { data } = await axios.get('/version', { baseURL: process.env.REACT_APP_API_URL })
      dispatch({
        type: RECEIVE_CURRENT_VERSON,
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
        daysAgo: moment(x.created_at).fromNow()
      }))

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
    case RECEIVE_CURRENT_VERSON:
      return {
        ...state,
        currentVersion: action.payload.version
      }
    default:
      return state
  }
}
