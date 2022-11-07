---
id: send-email
title: Send Email
---

--------------------

The email skill provides a quick way to send emails from within a Botpress workflow.

## Creating Your Skill

1. From the Flow Editor view, click **Insert Skill**.
1. Select **Send Email**. 

The following interface allows you to insert the information you would fill in when using any standard email service:

- **From, To, CC & BCC:** These fields are filled with email addresses. 
  - _From_: sender's email address
  - _To_: recipient's email
  - _CC_ (_carbon copy_): visible email addresses who receives a copy
  - _BCC_ (_blind carbon copy_): invisible email addresses who receives a copy

- **Subject:** subject of the email, a content element as the subject line.

:::note
Even if you use markdown in the subject line, it will render as plain text.
:::

- **Email Content:** content element, a message to be sent. 

:::note
Unlike the subject field, you can use markdown, which Botpress will render correctly to the receiver. You can also include HTML to enhance the formatting of your email body further.
:::

Botpress supports templating in all fields of your email skill, allowing access to variables stored in Memory. All `bot`, `user`, `session`, `temp`, and `event` are accessible via templating.

## Configuring Email Skill

To send an email using the email skill, you need to configure your chatbot with a transport connection string. Set the configuration string in the directory `...data/global/config/basic-skills.json`. For more information on the mail transporters available and how to configure them, please visit the [Nodemailer documentation](https://nodemailer.com/smtp/#examples).

You can edit those variable in Botpress from the **Code Editor**.

**Example:**

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
    "host": "smtp.gmail.com",
    "port": "587",
    "auth": {
      "user": "<your-google-email-id>",
      "pass": "<google-app-password>"
    },
    "secure": false,
    "requireTLS": true,
    "tls": {
      "rejectUnauthorized": false
    }
  }
}
```

The `transportConnectionString` could be an object or a string.

- **String**

```
smtps://example@gmail.com:superPassword@smtp.gmail.com
```

- **Object Format**

```
"transportConnectionString": {
    "host": "smtp.gmail.com",
    "port": "587",
    "auth": {
      "user": "<your-google-email-id>",
      "pass": "<google-app-password>"
    },
    "secure": false,
    "requireTLS": true,
    "tls": {
      "rejectUnauthorized": false
    }
  }
```

:::note Notes
- Setting `"rejectUnauthorized": false` will prevent the Botpress server from rebooting every time an email fails to send. We recommend a fall-back strategy if this happens using the `on failure` transition.
- If your email is protected with 2FA, it might not work.
- for testing with smpt.gmail.com, the password used is an app password and not your gmail password. To generate an app password visit  https://myaccount.google.com/apppasswords
:::
