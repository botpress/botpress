---
id: version-11.8.1-updating
title: Updating to New Releases
original_id: updating
---

Download the new version of Botpress [here](https://botpress.io/download).

Even though Botpress Server has become much more stable, breaking changes still might occur. When they do, resolving them is often as simple as editing config files in the `/data` folder.

See if your version is listed in the [migration guide](./advanced/migrate).

## SQLite

> ⚠️ Please backup your `/data` folder before making any changes

1. Download and extract the new version of Botpress
1. Copy the content of your previous `/data` folder
1. Paste the content into the `/data` folder of the new version

You can now follow the [migration guide](./advanced/migrate) if needed.

## PostgreSQL

> If you're not running in production or that your version is not listed in the [migration guide](./advanced/migrate), you can ignore this step

In production, `/data` is directly persisted to the database because of [version control](./advanced/versions/). You need to pull `/data` to your filesystem.

Luckily, we have a tool for that:

1. From the admin section, go to `Profile > Server > Version Control`.
1. Copy the command from Version Control
1. From your project root, open a terminal and execute the command

`/data` is now synced with to filesystem. You can follow the [migration guide](./advanced/migrate) and make the appropriate changes.

When the changes are made, restart Botpress and the filesystem will sync to the database automatically.
