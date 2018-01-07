const genid = require('nanoid/generate')

const safeAlphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'

exports.randomTableName = (prefix = 'tmp_') => `${prefix}${genid(safeAlphabet, 20)}`
