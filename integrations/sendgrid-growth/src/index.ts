import * as sdk from '@botpress/sdk'
import * as bp from '.botpress'
import axios from 'axios'
import { SendGridEmail, SendGridError, EmailAddress } from './types'

export default new bp.Integration({
  register: async (args) => {
    
    if (args.ctx.configuration.apiKey === '') {
      throw new sdk.RuntimeError('Please provide a SendGrid API key.')
    }
    
    try {
      const url = 'https://api.sendgrid.com/v3/scopes'

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${args.ctx.configuration.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
  
      if (response.status === 200) {
        args.logger.forBot().info('SendGrid API key validated. Configuration installed.');
      } else {
        throw new sdk.RuntimeError('The SendGrid API key is invalid. Please check your configuration.');
      }
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
  
        switch (status) {
          case 401:
            throw new sdk.RuntimeError('Unauthorized. The SendGrid API key is invalid or does not have the necessary permissions.');
          case 403:
            throw new sdk.RuntimeError('Forbidden. The API key does not have the permissions to access this endpoint.');
          case 404:
            throw new sdk.RuntimeError('Not Found. The requested endpoint or resource does not exist.');
          case 500:
            throw new sdk.RuntimeError('Internal Server Error. There was a problem with the SendGrid service.');
          default:
            throw new sdk.RuntimeError(`Unexpected error occurred. Status code: ${status}`);
        }
      } else {
        console.error('Error validating API key:', error.message);
        throw new sdk.RuntimeError('The SendGrid API key validation failed. Please check your configuration.');
      }
    }
  },
  unregister: async () => {
  },
  actions: {
    sendEmail: async (args): Promise<{}> => {
      args.logger.forBot().info('Test: Sending Email')
      const apiKey = args.ctx.configuration.apiKey

      let toAddresses: EmailAddress[] = []

      try {
        const parsedTo = JSON.parse(args.input.to)
        if (Array.isArray(parsedTo)) {
          toAddresses = parsedTo.map((email: string) => ({ email }))
        } else {
          toAddresses = [{ email: parsedTo }]
        }
      } catch (error) {
        toAddresses = [{ email: args.input.to }]
      }

      const email: SendGridEmail = {
        personalizations: [
          {
            to: toAddresses
          }
        ],
        from: { email: args.input.from },
        subject: args.input.subject,
        content: [
          {
            type: 'text/html',
            value: args.input.content
          }
        ]
      }
      const url = 'https://api.sendgrid.com/v3/mail/send'
  
      try {
        const response = await axios.post(url, email, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        })
        args.logger.forBot().info('Email sent successfully')
        return {}
      } catch (error: any) {
          const sendGridError: SendGridError = error.response.data
          args.logger.forBot().error('Error sending mail:', sendGridError.errors)
          throw new sdk.RuntimeError(`Error sending mail ${sendGridError.errors}`)
      }
    }
  },
  channels: {},
  handler: async () => {},
})
