import _ from 'lodash'
import Promise from 'bluebird'

import api from '../api'

import { LOCATION_CHANGE } from 'react-router-redux'

export const FETCH_TEAMS_REQUESTED = 'teams/FETCH_TEAMS_REQUESTED'
export const FETCH_TEAMS_RECEIVED = 'teams/FETCH_TEAMS_RECEIVED'

export const SWITCH_TEAM_REQUESTED = 'teams/SWITCH_TEAM_REQUESTED'
export const SWITCH_TEAM_RECEIVED = 'teams/SWITCH_TEAM_RECEIVED'

export const FETCH_PERMISSIONS_REQUESTED = 'teams/FETCH_PERMISSIONS_REQUESTED'
export const FETCH_PERMISSIONS_RECEIVED = 'teams/FETCH_PERMISSIONS_RECEIVED'

const initialState = {
  loadingTeams: false,
  loadingTeam: false,
  teamId: null,
  items: null,
  bots: null,
  members: null,
  roles: null,
  team: null,
  permissions: null,
  license: null
}

const teamIdRouteRegex = /^\/teams\/(\d+)/

export default (state = initialState, action) => {
  switch (action.type) {
    case LOCATION_CHANGE:
      const path = action.payload.pathname
      if (teamIdRouteRegex.test(path)) {
        const [, teamId] = path.match(teamIdRouteRegex)
        return { ...state, teamId: teamId }
      } else {
        return state
      }

    case FETCH_TEAMS_REQUESTED:
      return {
        ...state,
        loadingTeams: true
      }

    case FETCH_TEAMS_RECEIVED:
      return {
        ...state,
        loadingTeams: false,
        items: action.teams
      }

    case SWITCH_TEAM_REQUESTED:
      return {
        ...state,
        bots: null,
        team: null,
        teams: null,
        roles: null,
        teamId: action.teamId,
        loadingTeam: true
      }

    case SWITCH_TEAM_RECEIVED:
      return {
        ...state,
        bots: action.bots,
        teamId: action.teamId,
        team: action.team,
        members: action.members,
        roles: action.roles,
        loadingTeam: false
      }

    case FETCH_PERMISSIONS_REQUESTED:
      return {
        ...state,
        permissions: null
      }

    case FETCH_PERMISSIONS_RECEIVED:
      return {
        ...state,
        permissions: action.permissions
      }

    default:
      return state
  }
}

export const fetchTeams = () => {
  return async (dispatch, getState) => {
    const { teams: state } = getState()

    if (state.loadingTeams) {
      return
    }

    dispatch({
      type: FETCH_TEAMS_REQUESTED
    })

    const { data: teams } = await api.getSecured().get('/api/teams')

    dispatch({
      type: FETCH_TEAMS_RECEIVED,
      teams: teams.payload
    })
  }
}

const sortRoles = roles =>
  roles.sort((a, b) => {
    if (a.name === 'owner') {
      return -1
    }
    if (b.name === 'owner') {
      return 1
    }
    return a.name.localeCompare(b.name)
  })

export const fetchTeamData = (teamId, scopes = { bots: true, members: true, roles: true }) => {
  return async (dispatch, getState) => {
    const { teams: state } = getState()

    if (state.loadingTeam) {
      return
    }

    dispatch({ type: SWITCH_TEAM_REQUESTED, teamId })

    const data = await Promise.props({
      teams: api
        .getSecured()
        .get(`/api/teams`)
        .then(({ data }) => data),
      bots: scopes.bots
        ? api
            .getSecured()
            .get(`/api/teams/${teamId}/bots`)
            .then(({ data }) => data)
        : null,
      members: scopes.members
        ? api
            .getSecured()
            .get(`/api/teams/${teamId}/members`)
            .then(({ data }) => data)
        : null,
      roles: scopes.roles
        ? api
            .getSecured()
            .get(`/api/teams/${teamId}/roles`)
            .then(({ data }) => data)
        : null
    })

    const team = _.find(data.teams.payload, t => t.id == teamId) // eslint-disable-line eqeqeq

    dispatch({
      type: SWITCH_TEAM_RECEIVED,
      teamId,
      team,
      bots: scopes.bots ? data.bots.payload.bots : null,
      members: scopes.members ? data.members.payload : null,
      roles: scopes.roles ? sortRoles(data.roles.payload) : null
    })
  }
}

export const fetchExistingPermissions = () => {
  return async dispatch => {
    dispatch({ type: FETCH_PERMISSIONS_REQUESTED })

    const permissions = await api
      .getAnonymous()
      .get('/api/all-permissions')
      .then(({ data }) => data)

    dispatch({ type: FETCH_PERMISSIONS_RECEIVED, permissions })
  }
}
