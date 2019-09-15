---
id: version-11.8.1-faq
title: FAQ
original_id: faq
---

## How can I test a channel locally?

Some channels (e.g. Messenger) require to have a public secure url. When testing on locally, we recommend using services like [pagekite](https://pagekite.net/), [ngrok](https://ngrok.com) or [tunnelme](https://localtunnel.github.io/www/) to expose your server.

## Why are my images missing?

Assets are exposed using a configurable base path. Make sure the `EXTERNAL_URL` environment variable is set so that your assets are accessible from the outside.

You can set the environment variable in a `.env` file located under `/data`.

If you don't know anything about `.env` files, just create a new file named `.env` in your `/data` folder. Then add the following line to it:

```bash
EXTERNAL_URL=<public_url>
```

Replace `<public_url>` by your actual Botpress Server url.
