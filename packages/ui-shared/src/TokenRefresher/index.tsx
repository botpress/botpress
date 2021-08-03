import { StoredToken } from 'common/typings'

import ms from 'ms'
import { FC, useEffect, useState } from 'react'

import { TokenRefresherProps } from './typings'
import { tokenNeedsRefresh, getToken, setToken } from '~/../../ui-shared-lite/auth'

const REFRESH_INTERVAL = ms('5m')

const TokenRefresher: FC<TokenRefresherProps> = props => {
  const [tokenInterval, setTokenInterval] = useState<any>()

  useEffect(() => {
    setTokenInterval(
      setInterval(async () => {
        await tryRefreshToken()
      }, REFRESH_INTERVAL)
    )
  }, [])

  const tryRefreshToken = async () => {
    try {
      if (!tokenNeedsRefresh()) {
        return
      }

      const tokenData = getToken(false) as StoredToken

      const { data } = await props.getAxiosClient().get('/admin/auth/refresh')
      const { newToken } = data.payload

      if (newToken !== tokenData.token) {
        setToken(newToken)
        props.onRefreshCompleted?.(newToken)
        console.info('Token refreshed successfully')
      } else {
        clearInterval(tokenInterval)
      }
    } catch (err) {
      console.error('Error validating & refreshing token', err)
    }
  }

  return null
}

export default TokenRefresher
