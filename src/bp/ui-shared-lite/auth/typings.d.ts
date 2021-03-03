import { AxiosInstance } from 'axios'
import { StoredToken, TokenResponse } from 'common/typings'

export interface UserAuth {
  getToken: (onlyToken?: boolean) => StoredToken | string | undefined
  setToken: (token: Partial<TokenResponse>) => void
  isTokenValid: () => boolean
  logout: (getAxiosClient: () => AxiosInstance) => void
}
