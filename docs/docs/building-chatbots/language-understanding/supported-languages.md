---
id: supported-languages
title: Supported Languages
---

---

Normally, you only have one language for your chatbot.

## Supported Languages

- Arabic
- Dutch
- English
- French
- German
- Hebrew
- Italian
- Japanese
- Polish
- Portuguese
- Russian
- Spanish

## Change the Language

Botpress use the browser language to detect the user language. This is stored in the `language` field of the user attributes. It is possible to change the language of a user by modifying this field as the following example shows:

```js
await bp.users.updateAttributes("web", "someId", { language: "fr" });
```

:::tip
Take a look at [updateAttributes](https://botpress.com/reference/modules/_botpress_sdk_.users.html#updateattributes) for more information.
:::
