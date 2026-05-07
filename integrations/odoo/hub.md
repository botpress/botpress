The Odoo integration lets your Botpress chatbot work with Odoo contact records through Odoo's JSON-2 API. You can search, read, create, update, and delete contacts, retrieve contact field metadata, and validate the configured Odoo API key against the current Odoo user.

## Configuration

Before installing the integration, make sure you have:

- An Odoo instance with JSON-2 API access enabled.
- The Odoo database name.
- An API key for an Odoo user that has access to the contact records your bot needs to manage.

In Botpress, configure the integration with the following fields:

| Field    | Description                                                             |
| -------- | ----------------------------------------------------------------------- |
| Odoo URL | The base URL of your Odoo instance, such as `https://example.odoo.com`. |
| Database | The Odoo database name.                                                 |
| API Key  | The Odoo API key used to authenticate JSON-2 API requests.              |

When the integration is saved, Botpress validates the configuration by calling Odoo and retrieving the user ID associated with the API key. That user ID is stored in the integration state and can be used by actions that need to know which Odoo user is configured.

## Usage Notes

Odoo field values are passed as objects keyed by Odoo field name. For example, creating a contact might use values such as:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "phone": "+1 555 0100"
}
```

Odoo domains use the standard Odoo domain format. For example:

```json
[["email", "=", "ada@example.com"]]
```

You can pass an optional Odoo context object to contact actions when you need to control Odoo-specific request behavior.

## Limitations

- This version focuses on Odoo contacts (`res.partner`).
- The integration does not currently handle Odoo webhooks or incoming events.
- The integration does not provide Botpress channels for Odoo conversations.
- Delete protection depends on the contact's `user_id` owner field.
- Available fields, permissions, and validation rules depend on your Odoo instance and the permissions of the configured API key.

## Changelog

- 0.1.0: Added Odoo configuration validation and contact actions for field lookup, search, read, create, update, and delete.
