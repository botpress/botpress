import { z } from '@botpress/sdk'

/** User-friendly pastable url, to be extracted to subdomain for use in handler */
export const subdomain = z
  .string()
  .min(1)
  .title('BambooHR Subdomain')
  .describe("Your company's BambooHR subdomain (https://[subdomain].bamboohr.com)")

export const employeeId = z.string().min(1).title('Employee ID').describe('Unique identifier for the employee.')
export const employeeIdObject = z.object({ id: employeeId })

export const timestamp = z.string().title('Timestamp').describe('Timestamp in ISO 8601 format.')
