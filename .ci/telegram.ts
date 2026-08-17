export const name = 'integration-telegram'

import * as dab from './.dab/telegram'

export default dab.defineProject((ctx) => ({
  build: {
    docker: {
      context: '..',
      file: '../Dockerfile',
      target: 'telegram',
      platform: 'linux/arm64',
    },
  },
  env: {
    NODE_ENV: 'production',
  },
  secrets: {},
  host: `integration-telegram.foundation.${ctx.variables.DOMAIN}`,
  port: 8081,
  probes: {
    readiness: '/health',
  },
}))
