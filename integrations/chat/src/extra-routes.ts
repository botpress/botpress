import * as api from './api'
import openapi from './gen/openapi.json'

export type RouteTree = Record<string, Record<string, api.Route>>

export const extraRoutes: RouteTree = {
  '/hello': {
    get: async () => ({ status: 200, body: 'Hello, Botpress User 🤖' }),
  },
  '/openapi.json': {
    get: async () => ({ status: 200, body: JSON.stringify(openapi) }),
  },
  '/redoc': {
    get: async ({ ctx: { webhookId } }) => ({
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `<!DOCTYPE html>
    <html>
      <head>
        <title>Redoc</title>
        <!-- needed for adaptive design -->
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700"
          rel="stylesheet"
        />
    
        <!--
        Redoc doesn't change outer page styles
        -->
        <style>
          body {
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <redoc
          spec-url="/${webhookId}/openapi.json"
        ></redoc>
        <script src="https://unpkg.com/redoc@2.0.0-rc.72/bundles/redoc.standalone.js"></script>
      </body>
    </html>
    `,
    }),
  },
}
