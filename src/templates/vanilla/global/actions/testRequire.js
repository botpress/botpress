const _ = require('lodash')

const a = { name: 'Require module works!' }
bp.logger.debug(_.get(a, 'name'))
