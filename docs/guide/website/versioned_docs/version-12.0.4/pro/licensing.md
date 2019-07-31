---
id: version-12.0.4-licensing
title: Licensing
original_id: licensing
---

## Obtaining a License

Please contact sales@botpress.io to obtain a license.

## Activate your License

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

![BP license keys active](assets/bp-server-settings.jpg)
