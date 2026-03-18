import fs from 'fs'
import * as consts from '../../consts'
import * as utils from '../../utils'
import type { DiagnosticIssue } from '../types'
import { _createIssue, CATEGORY_AUTH } from './commons'

type GlobalCache = {
  apiUrl: string
  token: string
  workspaceId: string
  activeProfile: string
}

type ProfileCredentials = {
  apiUrl: string
  workspaceId: string
  token: string
}

const PLACEHOLDER_TOKENS = ['YOUR_TOKEN_HERE', 'changeme', 'CHANGE_ME', 'your-token', 'xxx', 'placeholder', 'TOKEN']

/**
 * Runs all authentication and profile checks in parallel and collects diagnostic issues
 * @param botpressHome - Path to .botpress home directory
 * @param profileArg - Optional profile specified via --profile flag
 * @returns Array of all diagnostic issues found across all auth checks
 */
export async function runAuthChecks(botpressHome: string, profileArg?: string): Promise<DiagnosticIssue[]> {
  const results = await Promise.all([
    _checkActiveProfile(botpressHome, profileArg),
    _checkToken(botpressHome, profileArg),
    _checkEndpoint(botpressHome, profileArg),
  ])

  return results.flat()
}

async function _checkActiveProfile(botpressHome: string, profileArg?: string): Promise<DiagnosticIssue[]> {
  const absBotpressHome = utils.path.absoluteFrom(utils.path.cwd(), botpressHome)
  const profilesPath = utils.path.absoluteFrom(absBotpressHome, consts.profileFileName)
  const globalCachePath = utils.path.absoluteFrom(absBotpressHome, consts.fromHomeDir.globalCacheFile)

  if (!fs.existsSync(profilesPath)) {
    return [
      _createIssue(
        'auth.no-profiles-file',
        CATEGORY_AUTH,
        'error',
        'Profiles file not found',
        { path: profilesPath },
        'Run `bp login` to create your first profile'
      ),
    ]
  }

  try {
    const profilesContent = await fs.promises.readFile(profilesPath, 'utf-8')
    const profiles: Record<string, ProfileCredentials> = JSON.parse(profilesContent)

    let profileToCheck: string

    if (profileArg) {
      profileToCheck = profileArg
    } else {
      if (fs.existsSync(globalCachePath)) {
        const cacheContent = await fs.promises.readFile(globalCachePath, 'utf-8')
        const cache: Partial<GlobalCache> = JSON.parse(cacheContent)
        profileToCheck = cache.activeProfile || consts.defaultProfileName
      } else {
        profileToCheck = consts.defaultProfileName
      }
    }

    if (!profiles[profileToCheck]) {
      const availableProfiles = Object.keys(profiles)
      return [
        _createIssue(
          'auth.no-profile',
          CATEGORY_AUTH,
          'error',
          `Profile "${profileToCheck}" not found`,
          {
            requestedProfile: profileToCheck,
            availableProfiles,
          },
          availableProfiles.length > 0
            ? `Use one of the available profiles: ${availableProfiles.join(', ')} or run \`bp login --profile ${profileToCheck}\``
            : `Run \`bp login --profile ${profileToCheck}\` to create this profile`
        ),
      ]
    }

    return [
      _createIssue('auth.profile-exists', CATEGORY_AUTH, 'ok', `Profile "${profileToCheck}" is configured`, {
        profile: profileToCheck,
        availableProfiles: Object.keys(profiles),
      }),
    ]
  } catch (error) {
    return [
      _createIssue(
        'auth.profile-read-error',
        CATEGORY_AUTH,
        'error',
        'Failed to read profiles configuration',
        { error: error instanceof Error ? error.message : String(error) },
        'Check if profiles.json is valid JSON or run `bp login` to recreate it'
      ),
    ]
  }
}

async function _checkToken(botpressHome: string, profileArg?: string): Promise<DiagnosticIssue[]> {
  const absBotpressHome = utils.path.absoluteFrom(utils.path.cwd(), botpressHome)
  const profilesPath = utils.path.absoluteFrom(absBotpressHome, consts.profileFileName)
  const globalCachePath = utils.path.absoluteFrom(absBotpressHome, consts.fromHomeDir.globalCacheFile)

  if (!fs.existsSync(profilesPath)) {
    return []
  }

  try {
    const profilesContent = await fs.promises.readFile(profilesPath, 'utf-8')
    const profiles: Record<string, ProfileCredentials> = JSON.parse(profilesContent)

    let profileToCheck: string

    if (profileArg) {
      profileToCheck = profileArg
    } else {
      if (fs.existsSync(globalCachePath)) {
        const cacheContent = await fs.promises.readFile(globalCachePath, 'utf-8')
        const cache: Partial<GlobalCache> = JSON.parse(cacheContent)
        profileToCheck = cache.activeProfile || consts.defaultProfileName
      } else {
        profileToCheck = consts.defaultProfileName
      }
    }

    const profile = profiles[profileToCheck]
    if (!profile) {
      return []
    }

    if (!profile.token) {
      return [
        _createIssue(
          'auth.no-token',
          CATEGORY_AUTH,
          'error',
          'No token configured for this profile',
          { profile: profileToCheck },
          `Run \`bp login${profileArg ? ` --profile ${profileArg}` : ''}\` to configure authentication`
        ),
      ]
    }

    if (profile.token.trim().length === 0) {
      return [
        _createIssue(
          'auth.empty-token',
          CATEGORY_AUTH,
          'error',
          'Token is empty or contains only whitespace',
          { profile: profileToCheck },
          `Run \`bp login${profileArg ? ` --profile ${profileArg}` : ''}\` to set a valid token`
        ),
      ]
    }

    const tokenUpper = profile.token.toUpperCase()
    const isPlaceholder = PLACEHOLDER_TOKENS.some((placeholder) => tokenUpper.includes(placeholder.toUpperCase()))

    if (isPlaceholder) {
      return [
        _createIssue(
          'auth.placeholder-token',
          CATEGORY_AUTH,
          'warning',
          'Token appears to be a placeholder value',
          { profile: profileToCheck, tokenPreview: profile.token.substring(0, 20) + '...' },
          'Replace with a real Personal Access Token from the Botpress dashboard'
        ),
      ]
    }

    return [
      _createIssue('auth.token-valid', CATEGORY_AUTH, 'ok', 'Token is configured', {
        profile: profileToCheck,
        tokenLength: profile.token.length,
      }),
    ]
  } catch {
    return []
  }
}

async function _checkEndpoint(botpressHome: string, profileArg?: string): Promise<DiagnosticIssue[]> {
  const absBotpressHome = utils.path.absoluteFrom(utils.path.cwd(), botpressHome)
  const profilesPath = utils.path.absoluteFrom(absBotpressHome, consts.profileFileName)
  const globalCachePath = utils.path.absoluteFrom(absBotpressHome, consts.fromHomeDir.globalCacheFile)

  if (!fs.existsSync(profilesPath)) {
    return []
  }

  try {
    const profilesContent = await fs.promises.readFile(profilesPath, 'utf-8')
    const profiles: Record<string, ProfileCredentials> = JSON.parse(profilesContent)

    let profileToCheck: string

    if (profileArg) {
      profileToCheck = profileArg
    } else {
      if (fs.existsSync(globalCachePath)) {
        const cacheContent = await fs.promises.readFile(globalCachePath, 'utf-8')
        const cache: Partial<GlobalCache> = JSON.parse(cacheContent)
        profileToCheck = cache.activeProfile || consts.defaultProfileName
      } else {
        profileToCheck = consts.defaultProfileName
      }
    }

    const profile = profiles[profileToCheck]
    if (!profile) {
      return []
    }

    if (!profile.apiUrl) {
      return [
        _createIssue(
          'auth.no-endpoint',
          CATEGORY_AUTH,
          'warning',
          'No API endpoint configured for this profile',
          { profile: profileToCheck },
          `Run \`bp login${profileArg ? ` --profile ${profileArg}` : ''}\` to configure the API endpoint`
        ),
      ]
    }

    if (profile.apiUrl.trim().length === 0) {
      return [
        _createIssue(
          'auth.empty-endpoint',
          CATEGORY_AUTH,
          'warning',
          'API endpoint is empty',
          { profile: profileToCheck },
          `Run \`bp login${profileArg ? ` --profile ${profileArg}` : ''}\` to set a valid API endpoint`
        ),
      ]
    }

    const urlLower = profile.apiUrl.toLowerCase()
    if (!urlLower.startsWith('http://') && !urlLower.startsWith('https://')) {
      return [
        _createIssue(
          'auth.invalid-endpoint',
          CATEGORY_AUTH,
          'warning',
          'API endpoint URL format is invalid',
          { profile: profileToCheck, apiUrl: profile.apiUrl },
          'API URL must start with http:// or https://'
        ),
      ]
    }

    try {
      new URL(profile.apiUrl)
    } catch {
      return [
        _createIssue(
          'auth.malformed-endpoint',
          CATEGORY_AUTH,
          'warning',
          'API endpoint URL is malformed',
          { profile: profileToCheck, apiUrl: profile.apiUrl },
          'Ensure the URL is properly formatted (e.g., https://api.botpress.cloud)'
        ),
      ]
    }

    return [
      _createIssue('auth.endpoint-valid', CATEGORY_AUTH, 'ok', 'API endpoint is properly configured', {
        profile: profileToCheck,
        apiUrl: profile.apiUrl,
      }),
    ]
  } catch {
    return []
  }
}
