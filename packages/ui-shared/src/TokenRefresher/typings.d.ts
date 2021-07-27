export interface TokenRefresherProps {
  getAxiosClient: () => AxiosInstance
  onRefreshCompleted?: (token) => void
}
