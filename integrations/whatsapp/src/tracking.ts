import { Analytics } from '@segment/analytics-node'
import integrationDefinition from 'integration.definition'
import * as bp from '.botpress'

// safely initialize analytics instance
let analytics: Analytics | undefined
try {
  analytics = new Analytics({ writeKey: bp.secrets.SEGMENT_KEY, flushAt: 1 })
} catch (error) {
  console.error('Could not initialize Segment analytics instance.')
}

// Track event function
export const trackIntegrationEvent = async (
  botId: string,
  eventName: string,
  eventProps: Record<string, any> = {}
): Promise<void> => {
  await new Promise((resolve) => {
    try {
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
            console.log('Error tracking event', err)
          }
          resolve(true)
        }
      )
    } catch (error) {
      console.log('Error tracking bot event', error)
      resolve(true)
    }
  })
}

// Identify bot function
export const identifyBot = async (botId: string, traits: Record<string, any>): Promise<void> => {
  await new Promise((resolve) => {
    try {
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
            console.log('Error identifying bot', err)
          }
          resolve(true)
        }
      )
    } catch (error) {
      console.log('Error identifying bot', error)
      resolve(true)
    }
  })
}
