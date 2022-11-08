# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

#### About search

In order to play aroud with search locally you need to set algolia env variables by default set to "empty"
`export ALGOLIA_API_KEY =__YOUR_ALGOLIA_API_KEY__`
`export ALGOLIA_APP_ID =__YOUR_ALGOLIA_APP_ID__`
`export ALGOLIA_INDEX =__YOUR_ALGOLIA_INDEX__`

A temporary solution has been done since we redirect everything from /docs/ to this documetation site. Whenever we remove this redirect we should remove the `customWithBaseUrl` function in the `src/theme/SearchBar/index.tsx` and use the native `withBaseUrl` instead.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Deployement is handled by Vercel
