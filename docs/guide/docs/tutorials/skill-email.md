---
id: skill-email
title: How to use Email Skill
---

## Overview

The email skill provides a quick way to send emails from within a Botpress workflow.

## Creating your skill

From the Flow Editor view, click on Insert Skill > Send Email. The following interface allows you to insert the information you would fill in when using any standard email service.
**From, To, CC & BCC** These fields are filled with email addresses. The _From_ field will be the sender's email address that the recipient will see when receiving an email from your chatbot. It can be configured to any valid email address.
**Subject** This field contains the subject of the email. You will need to create a content element that will load as the subject line. Please note that even if you use markdown in the subject line, it will render as plain text.
**Email Content** Again, this field will load from a content element. Unlike the subject field, you can use markdown, which Botpress will render correctly to the receiver. You can also include HTML to enhance the formatting of your email body further.

It is worthy to note that Botpress supports templating in all fields of your email skill, allowing access to variables stored in [Memory](../main/memory). All `bot`, `user`, `session`, `temp`, and `event` are accessible via templating. To access these variables, reference the memory location.

## Configuring Email Skill

To send an email using the email skill, you need to configure your chatbot with a transport connection string. Set the configuration string in the directory `...data/global/config/basic-skills.json`. For more information on the mail transporters available and how to configure them, please visit the [Nodemailer documentation](https://nodemailer.com/smtp/#examples)

You can edit those variable in botpress from the code editor.

![connection_string](../assets/tutorials/transportConnectionString.png)

Here is an example of a configuration using a mail server:

```json
{
  "$schema": "../../assets/modules/basic-skills/config.schema.json",
  "defaultContentElement": "builtin_single-choice",
  "defaultContentRenderer": "#builtin_single-choice",
  "defaultMaxAttempts": 3,
  "disableIntegrityCheck": true,
  "matchNumbers": true,
  "matchNLU": true,
  "transportConnectionString": {
    "host": "192.168.100.200",
    "port": "25",
    "secure": false,
    "tls": {
      "rejectUnauthorized": false
    }
  }
}
```

The `transportConnectionString` could be an object or a string.

**String**

```
smtps://example@gmail.com:superPassword@smtp.gmail.com
```

**Object Format**

```
  "transportConnectionString": {
    "host": "192.168.100.200",
    "port": "25",
    "secure": false,
    "tls": {
      "rejectUnauthorized": false
    }
  }
```

> Setting `"rejectUnauthorized": false` will prevent the Botpress server from rebooting every time an email fails to send. We recommend that you put in place a fall-back strategy if this happens using the `on failure` transition.

> If your email is protected with 2FA it might not work.
