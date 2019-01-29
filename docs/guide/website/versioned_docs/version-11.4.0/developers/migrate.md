---
id: version-11.4.0-migrate
title: Migrating from 11.3
original_id: migrate
---

## Known Changes

### Teams removed

Teams have been removed in 11.4 in favor of the **Workspace**.
Botpress Workspace is specified by `workspaces.json` and is used to associate bots, users and roles together.

### Bots table removed

**Bots** should be listed by their IDs in `workspaces.json` under `bots`.

### Users table removed

**Users** should be listed by their email in `workspaces.json` under `users`. All user data is stored in the workspace. This includes: email, hashed password and salt, last login, role, creation date.

### User ID -> User Email

User ID has been replaced by user email.

### Roles table removed

**Roles** should be defined in `workspaces.json` under `roles`. Each user have a _role_ property that should match the ID of their corresponding role.

**Rules** should be defined under `roles` / `rules` and respect the same format as before e.g. `[{"res":"*","op":"+r+w"}, {"res":"admin.*","op":"+r-w"}]`

> Multiple workspaces are not supported at this moment. They _might_ be added in a future version.

### Example

Below is an example of a `workspaces.json`:

```json
[
  {
    "name": "Default",
    "users": [
      {
        "email": "renaud@botpress.io",
        "password": "<password>",
        "salt": "<salt>",
        "last_ip": "",
        "last_logon": "2019-01-28T19:45:52.490Z",
        "role": "admin",
        "created_on": "2019-01-28T19:45:52.492Z"
      }
    ],
    "bots": ["test"],
    "roles": [
      {
        "id": "admin",
        "name": "Administrator",
        "description": "Administrators have full access to the workspace including adding members, creating bots and synchronizing changes.",
        "rules": [{ "res": "*", "op": "+r+w" }]
      },
      {
        "id": "dev",
        "name": "Developer",
        "description": "Developers have full read/write access to bots, including flows, content, NLU and actions",
        "rules": [
          { "res": "*", "op": "+r+w" },
          { "res": "admin.*", "op": "+r-w" },
          { "res": "admin.collaborators.*", "op": "-r" }
        ]
      },
      {
        "id": "editor",
        "name": "Content Editor",
        "description": "Content Editors have read/write access to content and NLU, and read-only access to flows and actions.",
        "rules": [{ "res": "*", "op": "+r" }, { "res": "admin.collaborators.*", "op": "-r" }]
      }
    ],
    "defaultRole": "dev",
    "adminRole": "admin"
  }
]
```
