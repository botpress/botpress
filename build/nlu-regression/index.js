const bitfan = require("@botpress/bitfan")

const bpdsIntents = require("./bpds-intents")
const bpdsSlots = require("./bpds-slots")
Promise.mapSeries([bpdsIntents, bpdsSlots], test => test(bitfan)).then(() => {})