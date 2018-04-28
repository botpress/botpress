/*
  Botpress module template. This is your module's entry point.
  Please have a look at the docs for more information about config, init and ready.
  https://botpress.io/docs
*/

module.exports = {
  config: {},

  // eslint-disable-next-line no-unused-vars
  init: async (bp, configurator, helpers) => {
    // This is called before ready.
    // At this point your module is just being initialized, it is not loaded yet.
  },

  // eslint-disable-next-line no-unused-vars
  ready: async (bp, configurator, helpers) => {
    // Your module's been loaded by Botpress.
    // Serve your APIs here, execute logic, etc.

    // eslint-disable-next-line no-unused-vars
    const config = await configurator.loadAll()
    // Do fancy stuff here :)
  }
}
