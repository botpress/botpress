import * as CalendlyDefs from 'definitions/calendly'
import type { CalendlyClient } from './utils'

export const getCurrentUser = async (axiosClient: CalendlyClient): Promise<CalendlyDefs.GetCurrentUserResponse> => {
  const resp = await axiosClient.get<object>(`/users/me`)
  return CalendlyDefs.getCurrentUserResponseSchema.parse(resp.data)
}
