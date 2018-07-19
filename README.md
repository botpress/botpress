## README

TODO

## Setup and run all modules

1. Install [Lerna](https://lernajs.io/) to manage multiple npm packages: `npm install -g lerna`
1. Install dependencies: `lerna exec yarn install`
1. Run build to transpile tsc to js: `lerna run build`
1. Start all the services: `lerna run start --parallel`