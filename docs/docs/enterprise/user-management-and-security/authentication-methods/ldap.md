---
id: ldap
title: LDAP
---

--------------------

## Prerequisite

- Botpress Pro enabled with a valid license key
- Information to access the LDAP server

## Quick Start

1. Open `botpress.config.json` and set `pro.auth.strategy = 'ldap'`
2. Configure the available options: [check the full configuration for more details](https://github.com/botpress/botpress/blob/master/packages/bp/src/core/config/botpress.config.ts)

## Field Mapping

The `fieldMapping` configuration allows you to match the existing properties of your users with the one Botpress uses. You can define these fields for users: `email`, either `fullname` or `firstname` with `lastname`, `company`, `role`, and `location`.

Whenever a user successfully logs on using SAML or LDAP, Botpress will update his details in his Botpress profile.

```js
{
  "fieldMapping": {
    "email": "emailAddressOnIdp",
    "fullname": "userFullName",
    "company": "!Botpress",
    "role": "userRole",
    "location": "officeLocation"
  }
}
```