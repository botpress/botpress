import { AxiosInstance } from 'axios'
import { TokenResponse } from 'common/typings'

export interface UserAuth {
  getToken: (onlyToken?: boolean) => TokenResponse | string | undefined
  setToken: (token: Partial<TokenResponse>) => void
  isTokenValid: () => boolean
  logout: (getAxiosClient: () => AxiosInstance) => void
}
