## README

[![CodeBuild](https://codebuild.us-east-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiamMxSkRSWTF6UHl6NjREN0tHajN0SHpUWUs3dnU4R1YvTDVFNTJYVHl1N3R2cStESnFHTitjeVBHV2Z2a21kK0tYMXZpbUl5YmVQaDFHSGFibGhtTHZzPSIsIml2UGFyYW1ldGVyU3BlYyI6IlhJK3FQSFZQb0VuQlpTWm8iLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)](https://console.aws.amazon.com/codebuild/home?region=us-east-1#/projects/botpress-server-binaries/view)

## Quick Start

1. Run `yarn` to fetch node packages
1. In the folder _src/bp/ui-admin_, run `yarn && yarn build`
1. Go back to the root of the project and run `yarn build` to compile TS files and copy static content
1. Run `yarn start` to start the server.

## Development

1. Run `yarn watch` to build the project and rebuild it everytime you change a .ts file
1. Run `yarn start` in another terminal

## Documentation

### Developer's Guide

We use [Docusaurus](https://docusaurus.io/en/) to create the Developer's Guide.

- To start the development server, run `yarn start:guide`
- To generate the static files, run `yarn build:guide`. The generated files will appear under `/docs/guide/build`

### SDK Reference

We use [TypeDoc](https://github.com/TypeStrong/typedoc) the generate the SDK Reference directly from the source code.

- Run `yarn build:reference` to generate the documentation. THe static files will appear under `/docs/reference/`.
