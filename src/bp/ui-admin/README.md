## README

## Quick Start

To enable hot reloading when working with UI-Admin, you need to start Botpress server first.
These configurations assumes that the proxy port is 3001.

1. Set the configuration `httpServer.cors.enabled` to `true` in `botpress.config.json`
1. Run Botpress server with `yarn start` in the main folder
1. Run `yarn start:dev` in `src/bp/ui-admin`

The command `start:dev` sets the API URL on port 3001 and starts the UI Admin on port 3002

## Manual Settings

You can still use `yarn start` and set parameters manually.

- REACT_APP_API_URL=http://localhost:3001
- PORT=3002
