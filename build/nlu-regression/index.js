const bitfan = require("@botpress/bitfan").default
const bluebird = require("bluebird")

const bpdsIntents = require("./bpds-intents")
const bpdsSlots = require("./bpds-slots")
bluebird.Promise.mapSeries([bpdsIntents, bpdsSlots], test => test(bitfan)).then(() => {})