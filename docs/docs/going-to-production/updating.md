---
id: updating
title: Updating Botpress
---

--------------------

Download the latest Botpress version [here](https://botpress.com/download).

## Version 12

### SQLite

:::caution
Please backup your `/data` folder before making any changes.
:::

1. Download and extract the new version of Botpress.
2. Copy the content of your previous `/data` folder.
3. Paste the content into the `/data` folder of the new version, then delete the `assets` folder.
4. Start Botpress with `--auto-migrate` on the command line, or `AUTO_MIGRATE=true` environment variable.

### PostgreSQL

:::caution
Please backup your database before making any changes.
:::

1. Download and extract the new version of Botpress.
2. Start Botpress with `--auto-migrate` on the command line, or `AUTO_MIGRATE=true` environment variable.

To start the latest version of Botpress on a new database, you will need to pull `/data` to your filesystem.

Luckily, we have a tool for that:

1. In Botpress running the old version, from the admin section, go to `Profile > Server > Version Control`.
2. Copy the command from **Version Control**, or **Download archive**.
3. From the old version's root, open a terminal and execute the command. `/data` is now synced to filesystem.
4. Copy `/data` and paste in the new version's root. If you downloaded the archive, extract its contents to `/data`.
5. Set the environment variable `DATABASE_URL` to the new database.
6. Start Botpress. The filesystem will sync to the database automatically.

#### Custom assets

For both database systems, if you have any custom assets, do these extra steps:

1. Start Botpress, wait for the server to be ready, then stop it. This creates the updated assets for all components.
2. Restore your custom asset files. Check and make sure they are compatible with your latest version.
3. Restart Botpress.

## Version 11 and earlier

Even though Botpress Server has become much more stable, breaking changes still might occur. When they do, resolving them is often as simple as editing config files in the `/data` folder.
