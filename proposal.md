# Language Models Mgmt

## Challenges

- We introduced the SVM-based intent classifier on top of pre-trained embeddings
- Production-grade embeddings are quite large (>1GB) and need to be loaded in RAM by our fastText wrapper
- Your Botpress Server instance needs a different text embedding for each language you need to support
- Loading large models in RAM takes a lot of time and memory
  - e.g: the `cc.300.en.bin` model takes 15 seconds and 7gb RAM on my computer

## Goals

1. Keep the size of Botpress Server small and fast to download
2. Keep Botpress Server fast to start for developers
3. Keep Botpress Server runnable on most dev laptops (should take <1gb RAM)
4. Models trained for production usage should use the best possible models
5. Keep updates to newer versions of Botpress quick and effortless
6. Keep sharing of bots easy and fast (the current `<datadir>/bots/BOT_ID/models` folder is too big to be shared conveniently)

## Proposal (backend)

1. We train and host on S3 pre-trained embeddings for many languages, including a `metadata.json` file that indexes the available models (see `metadata.json` example below)
2. We add native support for model discovery and download in the core (backend)
3. We add a `language_embeddings` entry in `botpress.config.json` (see example below)
4. For turn-key magic purposes, we ship with a single pre-trained embedding (`bp.25.en.bin`)
5. Downloaded models are kept in global cache directory (path overridable by ENV variable), so models are shared and persisted across multiple botpress versions / installations

## Proposal (frontend)

1. Add a "Languages" panel in the server-wide configuration that allows to browse, install and use the different models from the S3 `metadata.json` file and the local language cache directory
2. When using the multi-language feature of individual bots, we only show up the languages that have been added in the server-wide configuration and we add a link to show how to install new languages

---

##### metadata.json

```js
{
  "bp.25.en.bin": {
    trained_on: Date
    trained_by: 'Botpress, Inc.'
    size: Number
    code: 'en'
    name: 'English'
    flag64: 'base_64_icon'
    dimensions: 25 // the embeddings dimension
  },
  "bp.100.en.bin": { ... }
}
```

##### botpress.config.json

```js
{
  // ...
  "language_embeddings": {
    metadata_url: 'https://s3.aws.com/botpress/..../metadata.json',
    installed: {
      'en': /* language code */ {
        production_model: 'bp.100.en.bin',
        dev_model: 'bp.25.en.bin'
      }
    },
    download_automatically: 'always' | 'dev-only' | 'never'
    check_for_updates: 'dev-only' | 'always' | 'never'
  }
}
```
