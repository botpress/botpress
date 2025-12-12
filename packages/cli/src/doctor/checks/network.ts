import fs from 'fs'
import http from 'http'
import https from 'https'
import * as consts from '../../consts'
import * as utils from '../../utils'
import type { DiagnosticIssue } from '../types'
import { _createIssue, CATEGORY_NETWORK } from './commons'

type ProfileCredentials = {
  apiUrl: string
  workspaceId: string
  token: string
}

type GlobalCache = {
  apiUrl: string
  token: string
  workspaceId: string
  activeProfile: string
}

const HIGH_LATENCY_THRESHOLD_MS = 3000
const REQUEST_TIMEOUT_MS = 10000

/**
 * Runs all network connectivity checks in parallel and collects diagnostic issues
 * @param botpressHome - Path to .botpress home directory
 * @param profileArg - Optional profile specified via --profile flag
 * @returns Array of all diagnostic issues found across all network checks
 */
export async function runNetworkChecks(botpressHome: string, profileArg?: string): Promise<DiagnosticIssue[]> {
  const apiUrl = await _getApiUrl(botpressHome, profileArg)

  if (!apiUrl) {
    return [
      _createIssue(
        'network.no-endpoint',
        CATEGORY_NETWORK,
        'error',
        'No API endpoint configured to test network connectivity',
        {},
        'Run `bp login` to configure your API endpoint'
      ),
    ]
  }

  const results = await Promise.all([_checkApiReachability(apiUrl), _checkProxyConfiguration()])

  return results.flat()
}

async function _getApiUrl(botpressHome: string, profileArg?: string): Promise<string | null> {
  const absBotpressHome = utils.path.absoluteFrom(utils.path.cwd(), botpressHome)
  const profilesPath = utils.path.absoluteFrom(absBotpressHome, consts.profileFileName)
  const globalCachePath = utils.path.absoluteFrom(absBotpressHome, consts.fromHomeDir.globalCacheFile)

  try {
    if (!fs.existsSync(profilesPath)) {
      return null
    }

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
    return profile?.apiUrl || null
  } catch {
    return null
  }
}

async function _checkApiReachability(apiUrl: string): Promise<DiagnosticIssue[]> {
  const issues: DiagnosticIssue[] = []

  try {
    const url = new URL(apiUrl)
    const startTime = Date.now()

    const result = await _makeHttpRequest(url.href, REQUEST_TIMEOUT_MS)
    const latency = Date.now() - startTime

    if (result.statusCode >= 300 && result.statusCode < 400 && result.redirectUrl) {
      const redirectUrl = new URL(result.redirectUrl)
      const originalHost = url.hostname
      const redirectHost = redirectUrl.hostname

      if (originalHost !== redirectHost) {
        issues.push(
          _createIssue(
            'network.unexpected-redirect',
            CATEGORY_NETWORK,
            'warning',
            'API endpoint redirects to a different host',
            {
              originalUrl: url.href,
              redirectUrl: result.redirectUrl,
              originalHost,
              redirectHost,
            },
            'Verify that your API endpoint URL is correct'
          )
        )
      }
    }

    issues.push(
      _createIssue('network.reachable', CATEGORY_NETWORK, 'ok', 'API endpoint is reachable', {
        endpoint: apiUrl,
        statusCode: result.statusCode,
        latency: `${latency}ms`,
      })
    )

    if (latency > HIGH_LATENCY_THRESHOLD_MS) {
      issues.push(
        _createIssue(
          'network.high-latency',
          CATEGORY_NETWORK,
          'warning',
          `High network latency detected (${latency}ms)`,
          {
            latency,
            threshold: HIGH_LATENCY_THRESHOLD_MS,
          },
          'Check your internet connection or try using a closer network'
        )
      )
    }

    return issues
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      return [
        _createIssue(
          'network.dns-failure',
          CATEGORY_NETWORK,
          'error',
          'Failed to resolve API endpoint hostname',
          {
            endpoint: apiUrl,
            errorCode: error.code,
            hostname: new URL(apiUrl).hostname,
          },
          'Check your DNS settings or internet connection'
        ),
      ]
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENETUNREACH' || error.code === 'EHOSTUNREACH') {
      return [
        _createIssue(
          'network.unreachable',
          CATEGORY_NETWORK,
          'error',
          'Cannot connect to API endpoint',
          {
            endpoint: apiUrl,
            errorCode: error.code,
          },
          'Check your internet connection, firewall settings, or verify the API endpoint URL'
        ),
      ]
    }

    if (error.code === 'ETIMEDOUT' || error.timeout) {
      return [
        _createIssue(
          'network.timeout',
          CATEGORY_NETWORK,
          'error',
          `Connection to API endpoint timed out after ${REQUEST_TIMEOUT_MS}ms`,
          {
            endpoint: apiUrl,
            timeout: REQUEST_TIMEOUT_MS,
          },
          'Check your internet connection or firewall settings'
        ),
      ]
    }

    if (
      error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' ||
      error.code === 'CERT_HAS_EXPIRED' ||
      error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
      error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
      error.code?.startsWith('ERR_TLS_') ||
      error.message?.includes('certificate')
    ) {
      return [
        _createIssue(
          'network.ssl-error',
          CATEGORY_NETWORK,
          'error',
          'SSL/TLS certificate error',
          {
            endpoint: apiUrl,
            errorCode: error.code,
            errorMessage: error.message,
          },
          'Verify the API endpoint uses a valid SSL certificate. If using a custom endpoint, ensure the certificate is trusted.'
        ),
      ]
    }

    return [
      _createIssue(
        'network.error',
        CATEGORY_NETWORK,
        'error',
        'Network connectivity test failed',
        {
          endpoint: apiUrl,
          errorCode: error.code,
          errorMessage: error.message,
        },
        'Check your internet connection and verify the API endpoint URL'
      ),
    ]
  }
}

async function _checkProxyConfiguration(): Promise<DiagnosticIssue[]> {
  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy']
  const detectedProxies: Record<string, string> = {}

  for (const varName of proxyVars) {
    const value = process.env[varName]
    if (value) {
      detectedProxies[varName] = value
    }
  }

  if (Object.keys(detectedProxies).length === 0) {
    return []
  }

  return [
    _createIssue(
      'network.proxy-detected',
      CATEGORY_NETWORK,
      'ok',
      'Proxy configuration detected',
      {
        proxies: detectedProxies,
      },
      'If you experience connection issues, verify that your proxy configuration allows access to the Botpress API'
    ),
  ]
}

function _makeHttpRequest(
  url: string,
  timeout: number
): Promise<{ statusCode: number; redirectUrl?: string; body?: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'
    const client = isHttps ? https : http

    const req = client.get(
      url,
      {
        timeout,
        headers: {
          'User-Agent': 'Botpress-CLI-Doctor',
        },
      },
      (res) => {
        let body = ''

        res.on('data', (chunk) => {
          body += chunk
        })

        res.on('end', () => {
          const redirectUrl = res.headers.location
          resolve({
            statusCode: res.statusCode || 0,
            redirectUrl,
            body,
          })
        })
      }
    )

    req.on('timeout', () => {
      req.destroy()
      const error: any = new Error('Request timeout')
      error.timeout = true
      reject(error)
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.end()
  })
}
