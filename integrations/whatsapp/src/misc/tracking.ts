import { Analytics } from '@segment/analytics-node'
import integrationDefinition from 'integration.definition'
import * as bp from '.botpress'

// safely initialize analytics instance
let analyticsInstance: Analytics | undefined
const getOrCreateAnalytics = () => {
  if (analyticsInstance === undefined) {
    try {
      analyticsInstance = new Analytics({ writeKey: bp.secrets.SEGMENT_KEY, flushAt: 1, httpRequestTimeout: 2000 })
    } catch (thrown) {
      const errMsg = thrown instanceof Error ? thrown.message : String(thrown)
      throw new Error(`Could not initialize Segment analytics instance. - ${errMsg}`)
    }
  }
  return analyticsInstance
}

// Track event function
export const trackIntegrationEvent = async (
  botId: string,
  eventName: string,
  eventProps: Record<string, any> = {}
): Promise<void> => {
  await new Promise((resolve) => {
    try {
      const analytics = getOrCreateAnalytics()
      if (analytics === undefined) {
        return
      }
      analytics.track(
        {
          userId: botId,
          event: eventName,
          properties: {
            ...eventProps,
            name: integrationDefinition.name,
            description: integrationDefinition.description,
            title: integrationDefinition.title,
            version: integrationDefinition.version,
          },
        },
        (err?: unknown) => {
          if (err) {
            console.error('Error tracking event', err)
          }
          resolve(true)
        }
      )
    } catch (error) {
      console.error('Error tracking bot event', error)
      resolve(true)
    }
  })
}

// Identify bot function
export const identifyBot = async (botId: string, traits: Record<string, any>): Promise<void> => {
  await new Promise((resolve) => {
    try {
      const analytics = getOrCreateAnalytics()
      if (analytics === undefined) {
        return
      }
      analytics.identify(
        {
          userId: botId,
          traits,
        },
        (err?: unknown) => {
          if (err) {
            console.error('Error identifying bot', err)
          }
          resolve(true)
        }
      )
    } catch (error) {
      console.error('Error identifying bot', error)
      resolve(true)
    }
  })
}
