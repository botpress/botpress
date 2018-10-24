## README

[![CodeBuild](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiamMxSkRSWTF6UHl6NjREN0tHajN0SHpUWUs3dnU4R1YvTDVFNTJYVHl1N3R2cStESnFHTitjeVBHV2Z2a21kK0tYMXZpbUl5YmVQaDFHSGFibGhtTHZzPSIsIml2UGFyYW1ldGVyU3BlYyI6IlhJK3FQSFZQb0VuQlpTWm8iLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)](https://console.aws.amazon.com/codebuild/home?region=us-east-1#/projects/botpress-server-binaries/view)

## Quick Start

1. Run `yarn` to fetch node packages
1. Run `yarn bootstrap`. This will do the following commands:
   - Build the admin website and copy the static files to the assets folder i.e. `out/bp/ui-admin/public`
   - Build the module builder
   - Build the app and all the modules
1. Run `yarn start` to start the server.

### Building issues

If you have errors when building modules (timeout, random errors, etc), try the following:

1. Set the environment variable GULP_SERIES=true before starting the build
1. If it doesn't work, go in each module folder and type `yarn && yarn build`

## Development

1. Run `yarn watch` to rebuild everytime you change a .ts file
1. Run `yarn start` in another terminal
1. Optionnaly run `yarn watch` in each module folders you are working on

## Target a specific Botpress Edition

You can target a specific Botpress Edition when starting the app. Just add the following environment variable: `EDITION=<community|professional|enterprise> yarn start`. By default, `yarn start` will target the Community Edition.

## Documentation

### Developer's Guide

We use [Docusaurus](https://docusaurus.io/en/) to create the Developer's Guide.

- To start the development server, run `yarn start:guide`
- To generate the static files, run `yarn build:guide`. The generated files will appear under `/docs/guide/build`

### SDK Reference

We use [TypeDoc](https://github.com/TypeStrong/typedoc) the generate the SDK Reference directly from the source code.

- Run `yarn build:reference` to generate the documentation. THe static files will appear under `/docs/reference/`.
