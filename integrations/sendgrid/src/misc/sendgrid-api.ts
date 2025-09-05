import sgClient from '@sendgrid/client'
import sgMail from '@sendgrid/mail'
import type * as bp from '.botpress'

/** Gets or creates a SendGrid api request client.
 *
 *  @remark Always use this function over importing the request client from "@sendgrid/client" */
export const getOrCreateSendGridRequestClient = (config: bp.configuration.Configuration) => {
  sgClient.setApiKey(config.apiKey)
  return sgClient
}

/** Creates a SendGrid Mail api request client.
 *
 *  @remark Always use this function over importing the mail instance from "@sendgrid/mail" */
export const getOrCreateSendGridMailClient = (config: bp.configuration.Configuration) => {
  const sgRequestClient = getOrCreateSendGridRequestClient(config)
  sgMail.setClient(sgRequestClient)

  return sgMail
}
