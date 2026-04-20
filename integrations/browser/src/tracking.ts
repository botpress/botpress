import { posthogHelper } from '@botpress/common'
import { INTEGRATION_NAME, INTEGRATION_VERSION } from 'integration.definition'
import * as bp from '.botpress'

type TrackingEvent =
  | 'browser_registered'
  | 'browser_unregistered'
  | 'screenshot_captured'
  | 'web_search_performed'
  | 'pages_browsed'
  | 'large_page_scraped'
  | 'urls_discovered'
  | 'logo_fetched'
  | 'firecrawl_error'
  | 'screenshot_error'

type EventProperties = Record<string, string | number | boolean | undefined>

const getPostHogConfig = () => ({
  key: bp.secrets.POSTHOG_KEY,
  integrationName: INTEGRATION_NAME,
  integrationVersion: INTEGRATION_VERSION,
})

export const trackEvent = async (
  event: TrackingEvent,
  properties: EventProperties,
  distinctId?: string
): Promise<void> => {
  try {
    await posthogHelper.sendPosthogEvent(
      {
        distinctId: distinctId ?? 'no id',
        event,
        properties,
      },
      getPostHogConfig()
    )
  } catch {
    // Silently fail
  }
}
