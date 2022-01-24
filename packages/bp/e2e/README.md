## Botpress E2E tests

### Prerequisites

- A binary or source code version of Botpress running (preferably with an empty `data` folder)
- _(Optional)_ A license key (`BP_LICENSE_KEY` and `BP_CONFIG_PRO_ENABLED`) to run tests on the Pro version

### Setup

Go to `assets/config.ts` and make sure that the config fits your needs. You can also edit `Puppeteer` configurations in this file: `jest-puppeteer.config.js` if needed.

It is highly recommended to use a `.env` file for your environment variables as it will allow you to easily restart your server and delete the `data` folder without loosing your Botpress configurations.

The entrypoint to the tests is the `all.test.ts` file. Edit this file to only run certain tests.

### What to do when some tests fail

- Take look in the `<root>/build/tests/e2e/screenshots` folder as you should find screenshots of the state of the browser when the tests failed.
- Edit `Puppeteer` configs to slow the tests down. This will allow you to properly see what happens prior to the failure. **Also make sure that `HEADLESS` is `false`.**

### Useful commands

To run the E2E tests:

```sh
yarn test:e2e
```

To execute **all** the tests:

```sh
# Includes tests made against the Pro version
BP_CONFIG_PRO_ENABLED=true yarn test:e2e
```

| Note that when adding `BP_CONFIG_PRO_ENABLED` you also need to start Botpress using the Pro version

To **hide all the console logs** when running tests:

```sh
yarn test:e2e --silent
```

To run Chromium (the browser in which the tests are ran) in the **background**:

```sh
HEADLESS=true yarn test:e2e
```

To increase Jest timeout:

```sh
# Increases timeout for each tests to 30 seconds
JEST_TIMEOUT=30000 yarn test:e2e
```
