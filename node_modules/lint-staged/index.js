#!/usr/bin/env node

'use strict'

const cmdline = require('commander')
const pkg = require('./package.json')

cmdline
  .version(pkg.version)
  .option('-c, --config [path]', 'Path to configuration file')
  .parse(process.argv)

require('./src')(console, cmdline.config)
