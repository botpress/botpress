---
id: version-11.8.1-release-notes
title: Release Notes
original_id: release-notes
---

## Features

- Allow creation of revisions of a bot & allows rollback to those revisions
- New Dropdown component added for channel-web
- Modules can register an event handler to be notified of content element changes
- Modules can now be reloaded while botpress is running (developer experience)
- Added new hook `AfterEventProcessed`
- The base CSS of Channel-Web can be overwritten (or/and extended)
- Added possibility to set a password policy for basic authentication

## Bug fixes

- Bot ID can now be customized when creating a new bot
- Fix small UX issue which closed modals when clicking outside (thus, clearing the form)
- Fix CSV Import Tooltip (some information was missing)
- When deleting content from the CMS, the json files are correctly updated

## Documentation

- Document channel-messenger
- Document channel-telegram
- How to customize css of Channel-Web

## Changelog

Please look at the complete [changelog](https://github.com/botpress/botpress/blob/master/CHANGELOG.md) for more details.
