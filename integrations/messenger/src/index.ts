import { RuntimeError } from '@botpress/client'
import { sentry as sentryHelpers } from '@botpress/sdk-addons'
import queryString from 'query-string'
import { handleMessage } from './misc/incoming-message'
import { sendMessage } from './misc/outgoing-message'
import { MessengerPayload } from './misc/types'
import { formatGoogleMapLink, getCarouselMessage, getChoiceMessage, getMessengerClient } from './misc/utils'
import { handleOAuthRedirect, handleOAuthRedirectAndGetPages } from './utils/oauth'
import * as bp from '.botpress'
import Mustache from 'mustache'
import fs from 'fs'
import path from 'path'
import pageSelect from './wizzard/page-select.txt'
import teste from './wizzard/teste'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'

const integration = new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {},
  channels: {
    channel: {
      messages: {
        text: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            props.logger.forBot().debug('Sending text message from bot to Messenger:', payload.text)
            return messenger.sendText(recipientId, payload.text)
          }),
        image: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            props.logger.forBot().debug('Sending image message from bot to Messenger:', payload.imageUrl)
            return messenger.sendImage(recipientId, payload.imageUrl)
          }),
        markdown: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            props.logger.forBot().debug('Sending markdown message from bot to Messenger:', payload.markdown)
            return messenger.sendText(recipientId, payload.markdown)
          }),
        audio: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            props.logger.forBot().debug('Sending audio message from bot to Messenger:', payload.audioUrl)
            return messenger.sendAudio(recipientId, payload.audioUrl)
          }),
        video: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            props.logger.forBot().debug('Sending video message from bot to Messenger:', payload.videoUrl)
            return messenger.sendVideo(recipientId, payload.videoUrl)
          }),
        file: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            props.logger.forBot().debug('Sending file message from bot to Messenger:', payload.fileUrl)
            return messenger.sendFile(recipientId, payload.fileUrl)
          }),
        location: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            const googleMapLink = formatGoogleMapLink(payload)

            props.logger.forBot().debug('Sending location message from bot to Messenger:', googleMapLink)
            return messenger.sendText(recipientId, googleMapLink)
          }),
        carousel: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            const carouselMessage = getCarouselMessage(payload)

            props.logger.forBot().debug('Sending carousel message from bot to Messenger:', carouselMessage)
            return messenger.sendMessage(recipientId, getCarouselMessage(payload))
          }),
        card: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            const cardMessage = getCarouselMessage({ items: [payload] })

            props.logger.forBot().debug('Sending card message from bot to Messenger:', cardMessage)
            return messenger.sendMessage(recipientId, cardMessage)
          }),
        dropdown: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            const choiceMessage = getChoiceMessage(payload)

            props.logger.forBot().debug('Sending dropdown message from bot to Messenger:', choiceMessage)
            return messenger.sendMessage(recipientId, choiceMessage)
          }),
        choice: async ({ payload, ...props }) =>
          sendMessage(props, async (messenger, recipientId) => {
            const choiceMessage = getChoiceMessage(payload)

            props.logger.forBot().debug('Sending choice message from bot to Messenger:', choiceMessage)
            return messenger.sendMessage(recipientId, getChoiceMessage(payload))
          }),
        bloc: () => {
          throw new RuntimeError('Not implemented')
        },
      },
    },
  },
  handler: async ({ req, client, ctx, logger }) => {
    console.log('got request', {req})

    if (req.query.includes('code')) {
      try {
        const pages = await handleOAuthRedirectAndGetPages(req, client, ctx)

        const pagesHTML = pages.map(pageId => `<li onclick="location.assign('https://webhook.botpress.dev/87616b28-2c74-4572-bb16-211b349d54b2?pageId=${pageId}')"> ${pageId} </li>`)
        const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>React Component</title>
        </head>
        <body>
          
        </body>
        </html>
      `
        return {
          headers: {
            'Content-Type': 'text/html'
          },
          body: fullHtml
        }
      } catch (err: any) {
        const errorMessage = '(OAuth registration) Error: ' + err.message
        logger.forBot().error(errorMessage)
        return { status: 400, body: errorMessage }
      }
    } else if (req.query.includes('pageId')) {
      const page =
      // Create the full HTML with script tags to rehydrate on the client side
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>React Component</title>
        </head>
        <body>
          
        </body>
        </html>
      `
      return {
        headers: {
          'Content-Type': 'text/html'
        },
        body: fullHtml
      }
    }

    if (req.query) {
      const query: Record<string, string | string[] | null> = queryString.parse(req.query)
      if(query.redirect=='true') {
        return {
          status: 302,
          headers: {
            Location: 'https://facebook.com'
          },
          body: 'kkk'
        }
      } else {
        /*const pages =  [ { id: '1', name: 'Tester c' }, { id: '2', name: 'Tester 2 c' } ]
        const jsxElement = React.createElement('div', {}, [teste({ pages })])
        const htmlString = renderToStaticMarkup(jsxElement)
        console.log(htmlString)*/


        const pages =  [ { id: '1', name: 'Tester c' }, { id: '2', name: 'Tester 2 c' } ]
        const txtElement = JSON.stringify(teste({ pages }))
        console.log(txtElement)

        // Create the full HTML with script tags to rehydrate on the client side
        const fullHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>React Component</title>
          </head>
          <body>
            <div id="root">Loading</div>
            <script src="https://unpkg.com/react/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom/umd/react-dom.development.js"></script>
            <script>
              const container = document.getElementById('root');
              const root = ReactDOM.createRoot(container);
              const element = ${txtElement}
              const testeElement = React.createElement(
                'button', 
                { onClick: () => alert('Button Clicked!') }, 
                'Click me!'
              );
              console.log({element, testeElement})
              
              root.render(testeElement);
            </script>
          </body>
          </html>
        `

        console.log(fullHtml)

        return {
          headers: {
            'Content-Type': 'text/html'
          },
          body: fullHtml
        }
      }
    } else {
      return {
        body: 'no query'
      }
    }

    /*if (req.path.startsWith('/oauth')) {
      try {
        await handleOAuthRedirect(req, client, ctx)
        return { status: 200 }
      } catch (err: any) {
        const errorMessage = '(OAuth registration) Error: ' + err.message
        logger.forBot().error(errorMessage)
        return { status: 400, body: errorMessage }
      }
    }*/

    logger.forBot().debug('Handler received request from Messenger with payload:', req.body)

    if (req.query) {
      const query: Record<string, string | string[] | null> = queryString.parse(req.query)

      const mode = query['hub.mode']
      const token = query['hub.verify_token']
      const challenge = query['hub.challenge']

      if (mode === 'subscribe') {
        if (token === ctx.configuration.verifyToken) {
          if (!challenge) {
            logger.forBot().warn('Returning HTTP 400 as no challenge parameter was received in query string of request')
            return {
              status: 400,
            }
          }

          return {
            body: typeof challenge === 'string' ? challenge : '',
          }
        } else {
          logger
            .forBot()
            .warn("Returning HTTP 403 as the Messenger token doesn't match the one in the bot configuration")
          return {
            status: 403,
          }
        }
      } else {
        logger.forBot().warn(`Returning HTTP 400 as the '${mode}' mode received in the query string isn't supported`)
        return {
          status: 400,
        }
      }
    }

    if (!req.body) {
      logger.forBot().warn('Handler received an empty body, so the message was ignored')
      return
    }

    try {
      const data = JSON.parse(req.body) as MessengerPayload

      for (const { messaging } of data.entry) {
        for (const message of messaging) {
          await handleMessage(message, { client, ctx, logger })
        }
      }
    } catch (e: any) {
      logger.forBot().error('Error while handling request:', e)
      logger.forBot().debug('Request body received:', req.body)
    }

    return
  },
  createUser: async ({ client, tags, ctx }) => {
    const userId = tags.id
    if (!userId) {
      return
    }

    const messengerClient = await getMessengerClient(client, ctx)
    const profile = await messengerClient.getUserProfile(userId)

    const { user } = await client.getOrCreateUser({ tags: { id: `${profile.id}` } })

    return {
      body: JSON.stringify({ user: { id: user.id } }),
      headers: {},
      statusCode: 200,
    }
  },
  createConversation: async ({ client, channel, tags, ctx }) => {
    const userId = tags.id
    if (!userId) {
      return
    }

    const messengerClient = await getMessengerClient(client, ctx)
    const profile = await messengerClient.getUserProfile(userId)

    const { conversation } = await client.getOrCreateConversation({
      channel,
      tags: { id: `${profile.id}` },
    })

    return {
      body: JSON.stringify({ conversation: { id: conversation.id } }),
      headers: {},
      statusCode: 200,
    }
  },
})

export default sentryHelpers.wrapIntegration(integration, {
  dsn: bp.secrets.SENTRY_DSN,
  environment: bp.secrets.SENTRY_ENVIRONMENT,
  release: bp.secrets.SENTRY_RELEASE,
})
