# Email integration

## Description

This integration provides Internet Messaging Access Protocol (IMAP) and Simple Messaging Transport Protocol (SMTP) actions to read and send email messages.

## Getting started

### Configuration

The configuration contains three required fields. Here is an example of config

```yml
user: yourEmailAccount@gmail.com
password: yourAccountPassword
host: imap.gmail.com #for gmail
```

### Usage example

To use:

## Actions

### `listEmails`

Upon receiving a new email, the bot will summarize it to you.

### `sendEmail`

Send an email to someone using a provided email

### `syncEmails`

Refresh emails and create new messages for the emails you have not seen yet.
