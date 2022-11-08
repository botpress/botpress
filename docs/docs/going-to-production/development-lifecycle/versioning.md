---
id: versioning
title: Versioning
---

---

Once your bot is deployed, the good part is that you (and non-technical team members) can still make changes to your bots from Botpress Conversation Studio. This is one major advantage of using Botpress. This is made possible by our built-in versioning system.

For your convenience Botpress provides the GUI tools to edit these files while in development. We also provide the same tools in production, but there's a caveat. Writing changes to the server's file system is not always possible, they could easily be lost due to ephemeral filesystems or they could be ignored when running in a cluster setup.

To address this issue, we added commands to the cli. In production, your changes are saved to the database which is persisted between deployments. Botpress cli gives you two commands: `bp pull` to pull pending changes on your server for all your bots and server wide files and `bp push` to push your local changes to your server.

You can also head to the versioning tab of your botpress admin panel at https://your.bp.ai/admin/server/version, the command will be properly formatted for you (including your token) any changes have been made. Just paste it to your shell and the changes will be extracted in the provided target directory. A successful output should look like the following:

![versioning pull](/assets/versioning-pull.png)

Notice that without any changes, you will see a **You're all set!** message.

## CLI Commands

:::note
The `BPFS_STORAGE` environment variable must be set to `database` to enable **pushing** to this node.
:::

Please note that `targetDir` and `sourceDir` uses relative paths:

### Pull

**Binary:**

```bash
./bp pull --url <url> --token <auth_token> --targetDir <remote_data_path>
```

**Docker:**

```bash
docker exec -it <container> bash -c "./bp pull --url <url> --token <auth_token> --targetDir <remote_data_path>"
```

### Push

**Binary:**

```bash
./bp push --url <url> --token <auth_token> --sourceDir <local_data_path>
```

**Docker:**

```bash
docker exec -it <container> bash -c "./bp push --url <url> --token <auth_token> --sourceDir <local_data_path>"
```
