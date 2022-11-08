---
id: enterprise-licensing
title: Enterprise Licensing
---

--------------------

The server license tab is meant to be used when you want to have a enterprise environment. This enables a lot of new [options and features(/overview/features/enterprise-specific-features)]. Don't forget that you also have all the other features of the free edition.

## Obtain a License

Please contact our sales team using the request demo form on our [website](https://botpress.com/request-demo).

:::info
When giving us you URL information to get your license key, don't forget that it must be the exact URL, or it won't work.
:::

## Add an Enterprise License

1. In your Admin Dashboard, go to the **Server License** tab.
1. Click **Enable Pro & Reboot Server**.
1. Click **Enable** in the dialog box.
    ...Wait for the server to reboot...
1. Click **Enter license key**.
1. Paste the license key that you were given.
1. Click **Validate**.

This will let you do everything that is cautioned as Enterprise Only.

## Activate Your License

When starting Botpress, use the `BP_LICENSE_KEY=<license_key>` environment variable as well as the `EXTERNAL_URL=<public_url>` environment variable.

**Binary**

```bash
BP_LICENSE_KEY=<license_key> EXTERNAL_URL=<public_url> ./bp
```

**Docker**

```bash
docker run -d \
--name botpress \
-p 3000:3000 \
-v botpress_data:/botpress/data \
-e BP_LICENSE_KEY=<license_key> \
-e EXTERNAL_URL=<public_url> \
botpress/server:$TAG
```

## License Breach and Details

If you happen to breach your license (e.g you try to add more nodes than allowed on your license), your bots won't work anymore until you either update your license or get back to an unbreached license state.

If you don't remember the limits of your currently activated license, you can always go to the **Server Settings** page in your user top right menu. There you'll have all information on your current license.