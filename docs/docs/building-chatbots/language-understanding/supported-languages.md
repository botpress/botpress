---
id: supported-languages
title: Supported Languages
---

---

Normally, you only have one language for your chatbot. However, you can add other languages by translating your content.

:::note
With the Enterprise License, you can easily work with the built-in translation functionality.
:::

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

## Add a Language

1. In the Admin section, click **Bots**.
2. Click the **Config** button next to the selected bot.
3. In the **General** section:
   1. Under **Default language**, use the dropdown menu to select the desired default language which is gonna be used in the interface.
   2. Under **Supported languages**, with the dropdown menu or by writing it in the box, choose the languages you need.
      :::note
      The **Supported languages** section appears only when you enable the [Enterprise Licensing](/enterprise/licensing/enterprise-licensing).
      :::
4. Click **Save Changes**.

![Bot Config](/assets/i18n-configs.png)

## Change the Language

Botpress use the browser language to detect the user language. This is stored in the `language` field of the user attributes. It is possible to change the language of a user by modifying this field as the following example shows:

```js
await bp.users.updateAttributes("web", "someId", { language: "fr" });
```

:::tip
Take a look at [updateAttributes](https://botpress.com/reference/modules/_botpress_sdk_.users.html#updateattributes) for more information.
:::
