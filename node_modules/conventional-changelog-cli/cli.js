#!/usr/bin/env node
'use strict'

var addStream = require('add-stream')
var conventionalChangelog = require('conventional-changelog')
var fs = require('fs')
var meow = require('meow')
var tempfile = require('tempfile')
var _ = require('lodash')
var resolve = require('path').resolve

var cli = meow(`
    Usage
      conventional-changelog

    Example
      conventional-changelog -i CHANGELOG.md --same-file

    Options
      -i, --infile              Read the CHANGELOG from this file

      -o, --outfile             Write the CHANGELOG to this file
                                If unspecified, it prints to stdout

      -s, --same-file           Outputting to the infile so you don't need to specify the same file as outfile

      -p, --preset              Name of the preset you want to use. Must be one of the following:
                                angular, atom, codemirror, ember, eslint, express, jquery, jscs or jshint

      -k, --pkg                 A filepath of where your package.json is located
                                Default is the closest package.json from cwd

      -a, --append              Should the newer release be appended to the older release
                                Default: false

      -r, --release-count       How many releases to be generated from the latest
                                If 0, the whole changelog will be regenerated and the outfile will be overwritten
                                Default: 1

      -u, --output-unreleased   Output unreleased changelog

      -v, --verbose             Verbose output. Use this for debugging
                                Default: false

      -n, --config              A filepath of your config script
                                Example of a config script: https://github.com/conventional-changelog/conventional-changelog-angular/blob/master/index.js

      -c, --context             A filepath of a json that is used to define template variables
      -l, --lerna-package       Generate a changelog for a specific lerna package (:pkg-name@1.0.0)
      --commit-path             Generate a changelog scoped to a specific directory
`, {
  flags: {
    infile: {
      alias: `i`
    },
    outfile: {
      alias: `o`
    },
    'same-file': {
      alias: `s`
    },
    preset: {
      alias: `p`
    },
    pkg: {
      alias: `k`
    },
    append: {
      alias: `a`
    },
    'release-count': {
      alias: `r`
    },
    'output-unreleased': {
      alias: `u`
    },
    verbose: {
      alias: `v`
    },
    config: {
      alias: `n`
    },
    'lerna-package': {
      alias: `l`
    }
  }
})

var config
var flags = cli.flags
var infile = flags.infile
var outfile = flags.outfile
var sameFile = flags.sameFile
var append = flags.append
var releaseCount = flags.releaseCount

if (infile && infile === outfile) {
  sameFile = true
} else if (sameFile) {
  if (infile) {
    outfile = infile
  } else {
    console.error('infile must be provided if same-file flag presents.')
    process.exit(1)
  }
}

var options = _.omit({
  preset: flags.preset,
  pkg: {
    path: flags.pkg
  },
  append: append,
  releaseCount: releaseCount,
  outputUnreleased: flags.outputUnreleased,
  lernaPackage: flags.lernaPackage
}, _.isUndefined)

if (flags.verbose) {
  options.debug = console.info.bind(console)
  options.warn = console.warn.bind(console)
}

var templateContext

var outStream

try {
  if (flags.context) {
    templateContext = require(resolve(process.cwd(), flags.context))
  }

  if (flags.config) {
    config = require(resolve(process.cwd(), flags.config))
    options.config = config
  } else {
    config = {}
  }
} catch (err) {
  console.error('Failed to get file. ' + err)
  process.exit(1)
}

var gitRawCommitsOpts = _.merge({}, config.gitRawCommitsOpts || {})
if (flags.commitPath) gitRawCommitsOpts.path = flags.commitPath

var changelogStream = conventionalChangelog(options, templateContext, gitRawCommitsOpts, config.parserOpts, config.writerOpts)
  .on('error', function (err) {
    if (flags.verbose) {
      console.error(err.stack)
    } else {
      console.error(err.toString())
    }
    process.exit(1)
  })

function noInputFile () {
  if (outfile) {
    outStream = fs.createWriteStream(outfile)
  } else {
    outStream = process.stdout
  }

  changelogStream
    .pipe(outStream)
}

if (infile && releaseCount !== 0) {
  var readStream = fs.createReadStream(infile)
    .on('error', function () {
      if (flags.verbose) {
        console.warn('infile does not exist.')
      }

      if (sameFile) {
        noInputFile()
      }
    })

  if (sameFile) {
    if (options.append) {
      changelogStream
        .pipe(fs.createWriteStream(outfile, {
          flags: 'a'
        }))
    } else {
      var tmp = tempfile()

      changelogStream
        .pipe(addStream(readStream))
        .pipe(fs.createWriteStream(tmp))
        .on('finish', function () {
          fs.createReadStream(tmp)
            .pipe(fs.createWriteStream(outfile))
        })
    }
  } else {
    if (outfile) {
      outStream = fs.createWriteStream(outfile)
    } else {
      outStream = process.stdout
    }

    var stream

    if (options.append) {
      stream = readStream
        .pipe(addStream(changelogStream))
    } else {
      stream = changelogStream
        .pipe(addStream(readStream))
    }

    stream
      .pipe(outStream)
  }
} else {
  noInputFile()
}
