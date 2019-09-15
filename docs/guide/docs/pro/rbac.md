---
id: rbac
title: Configuring RBAC
---

> **Note**: This is a Botpress Pro feature

**RBAC** (Role-Based Access Control) allows you to control what collaborators have access to.

By default, Botpress ships with three roles (administrator, developer and content editor), but you can change those and create new ones.

## Assigning a role to a collaborator

From the Administration dashboard, navigate to the "Collaborators" tab and click the "more" arrow on any collaborator to change its role to an existing role.

![RBAC](assets/rbac.png)

## Adding a new role

In the `<data>/global/workspaces.json` file, you'll find the `roles` property, which is an array of all the roles you can assign to the collaborators on your workspace. You can add, remove and edit roles by modifying this array directly.

### Rules

Rules are executed sequentially from first to last, and the permission is checked at the end of applying all the rules.

For example the following rules:

1. `+r-w` on `*`
2. `+w` on `bot.content`
3. `-r` on `bot.flows`

Means the user will _see_ everything but the flows, and won't be able to _change_ anything but flows.

### Operations (op)

| op  | description  |
| --- | ------------ |
| +r  | Grant read   |
| -r  | Revoke read  |
| +w  | Grant write  |
| -w  | Revoke write |

### Available Ressources (res)

| res               | description                                  |
| ----------------- | -------------------------------------------- |
| \_                | \_                                           |
| bot.\*            | All bots inside the workspace                |
| bot.logs          | The runtime logs                             |
| bot.notifications | Notifications                                |
| bot.skills        | The flow skills                              |
| bot.media         | File uploads (via the CMS)                   |
| bot.content       | The CMS elements (what the bot says)         |
| bot.flows         | The flow editor                              |
| bot.information   | Information about the bot                    |
| \_                | \_                                           |
| admin.\*          | The admin dashboard (/admin)                 |
| admin.users       | Admin collaborators                          |
| admin.roles       | Assigning roles ro collaborators             |
| admin.bots        | Creating bots and changing their information |
| \_                | \_                                           |
| module.\*         | Global access to all modules                 |
| module.MODULE_ID  |                                              |

For now, modules only support a single top-level ressource **and one operation (write)**. The ressource path is defined as `module.MODULE_ID`, for example `module.hitl` or `module.code-editor`.

### Example

```json
{
  "id": "hitl",
  "name": "Human in the Loop",
  "description": "Can view and respond to users by using the HITL module",
  "rules": [
    {
      "res": "*",
      "op": "+r"
    },
    {
      "res": "module.hitl",
      "op": "+r+w"
    }
  ]
}
```
