import * as botpress from '.botpress'
import * as bpclient from "@botpress/client"
import axios from 'axios'
import { CalendlyData, WebhookSubscriptionData, WebhookSubscription, calendlyErrorSchema } from './const'

type IntegrationLogger = botpress.Client['client']['logger']

export const getCurrentUserAPICall = async (accessToken: string, logger: IntegrationLogger) => {
  let organizationID = ''
  let userID = ''

  const getUserOptions = {
    method: 'GET',
    url: 'https://api.calendly.com/users/me',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  }

  try {
    // Make the request and wait for the response
    const response = await axios.request(getUserOptions)

    // Extract organizationID and userID from the response
    organizationID = response.data.resource.current_organization
    userID = response.data.resource.uri

  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Specific handling for Axios errors
      const statusCode = error.response ? error.response.status : 'No Status Code'
      const statusText = error.response ? error.response.statusText : 'No Status Text'
      const detailedMessage = `Axios error - ${statusCode} ${statusText}: ${error.message}`
    
      // Log the response body to see the actual error data structure
      if (error.response) {
        const result = errorSchemaScheduleEvent.safeParse(error.response.data)
        if (result.success) {
          logger.forBot().error(`Error getting Calendly user: ${result.data.message}`)
          throw new bpclient.RuntimeError(result.data.message)
        } else {
          logger.forBot().error(`Error data parsing failure: ${JSON.stringify(result.error, null, 2)}`)
        }
      }
  
      logger.forBot().error(detailedMessage);
      throw new bpclient.RuntimeError(detailedMessage);
    } else {
      // Handle non-Axios errors
      const errorMessage = `Unexpected error type encountered while getting Calendly user: ${JSON.stringify(error, null, 2)}`
      logger.forBot().error(errorMessage);
      throw new bpclient.RuntimeError(errorMessage)
    }
  }
  return { organizationID, userID }
}

export const getEventTypesAPICall = async (userID: string, accessToken: string, logger: IntegrationLogger) => {

  const getEventOptions = {
    method: 'GET',
    url: 'https://api.calendly.com/event_types',
    params: {
      active: 'true',
      user: userID,
      count: '20'
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  }

  try {
    // Make the request and wait for the response
    const response = await axios.request(getEventOptions)
    return response.data

  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Specific handling for Axios errors
      const statusCode = error.response ? error.response.status : 'No Status Code';
      const statusText = error.response ? error.response.statusText : 'No Status Text';
      const detailedMessage = `Axios error - ${statusCode} ${statusText}: ${error.message}`;
    
      // Log the response body to see the actual error data structure
      if (error.response) {
        const result = calendlyErrorSchema.safeParse(error.response.data);
        if (result.success) {
          logger.forBot().error(`Error getting Calendly event types: ${result.data.message}`);
          throw new bpclient.RuntimeError(result.data.message);
        } else {
          logger.forBot().error(`Error data parsing failure: ${JSON.stringify(result.error, null, 2)}`);
        }
      }
  
      logger.forBot().error(detailedMessage);
      throw new bpclient.RuntimeError(detailedMessage);
    } else {
      // Handle non-Axios errors
      const errorMessage = `Unexpected error type encountered while getting Calendly event types: ${JSON.stringify(error, null, 2)}`;
      logger.forBot().error(errorMessage);
      throw new bpclient.RuntimeError(errorMessage);
    }
  }
}

export function findEventTypeUriBySchedulingUrl(data: CalendlyData, schedulingUrl: string) {

  for (let eventType of data.collection) {
    if (eventType.scheduling_url === schedulingUrl) {
      return eventType.uri
    }
  }
  return ''
}

export async function getWebhookSubscriptionsAPICall(organizationID: string, userID: string, accessToken: string, logger: IntegrationLogger) {

  let webhooks = {} as WebhookSubscriptionData

  const options = {
    method: 'GET',
    url: 'https://api.calendly.com/webhook_subscriptions',
    params: {
      organization: organizationID,
      user: userID,
      scope: 'user'
    },
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  }

  try {
    const response = await axios.request(options)
    webhooks = response.data

  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Specific handling for Axios errors
      const statusCode = error.response ? error.response.status : 'No Status Code';
      const statusText = error.response ? error.response.statusText : 'No Status Text';
      const detailedMessage = `Axios error - ${statusCode} ${statusText}: ${error.message}`;
    
      // Log the response body to see the actual error data structure
      if (error.response) {
        const result = calendlyErrorSchema.safeParse(error.response.data);
        if (result.success) {
          logger.forBot().error(`Error getting Calendly webhooks: ${result.data.message}`);
          throw new bpclient.RuntimeError(result.data.message);
        } else {
          logger.forBot().error(`Error data parsing failure: ${JSON.stringify(result.error, null, 2)}`);
        }
      }
  
      logger.forBot().error(detailedMessage);
      throw new bpclient.RuntimeError(detailedMessage);
    } else {
      // Handle non-Axios errors
      const errorMessage = `Unexpected error type encountered while getting Calendly webhooks: ${JSON.stringify(error, null, 2)}`;
      logger.forBot().error(errorMessage);
      throw new bpclient.RuntimeError(errorMessage);
    }
  }

  return webhooks
}

export function findWebhookSubscriptionByCallbackUrl(
  collection: WebhookSubscription[],
  callbackUrl: string
): WebhookSubscription | null {
  return collection.find(subscription => subscription.callback_url === callbackUrl) || null
}