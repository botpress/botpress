---
id: configure-pipeline
title: Configure Pipeline
---

---

## Git Syncing – Source Control Management

A best practice is to keep track of changes to your chatbot using your preferred [Source Control Management Tool (SCM)](https://www.softwaretestinghelp.com/version-control-software/) and always deploy the master branch in production. Once deployed, you can regularly pull changes and update them to your SCM or revert to them when the need arises. Doing so helps you harness your SCM power for branches, merging conflicting files, reviewing changes, and creating revisions.

Let's suppose that you have a more complex deployment pipeline with one or multiple staging environment(s) with pending changes on each environment. In that case, you can easily track and work on them using development pipelines.

### Setting up Botpress Git Syncing (with GitHub)

1. [Download Botpress](https://botpress.com/download).
2. Open your terminal.
3. Type `cd [PATH]/botpress-[VERSION]`.
4. Set up GitHub remote tracking:

```
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:[GH_USERNAME]/bp-project.git
git push -u origin main
```

4. You can add a develop and staging branch to fit your workflow, if needed.
5. Everytime you make a change in the Conversation Studio or in your preferred code editor, you can commit that change to track changes.
6. When you are ready to send you chatbot to production, you can type `git merge` in your terminal.
7. Then, you type `checkout master` in your terminal and you go to your Botpress Admin to export your chatbot.
8. You upload it on your production environment (usually cloud deployment).

### Syncing Changes Between Environments

We will use Git to sync changes between 2 environments and promote an environment (i.e., promote staging to production).

Let's assume that given a pipeline with three environments (**development**, **staging**, and **production**), there are some changes both on production and staging, and you want to promote staging to production. What you want to do is the following:

1. Merge production into staging which might result in a merge conflict.
2. Resolve conflicts using any merge conflict tool (such as VSCode, Sublime Merge).
3. Push the results to master so they are deployed to your production environment.

First, create a branch and sync it with the production environment:

```
git checkout master && git checkout -b prod-sync
./bp pull --url {PROD_SERVER_URL} --authToken {YOUR_AUTH_TOKEN} --targetDir {TARGET_DIRECTORY}
git commit -am 'sync prod'
```

Repeat the process with staging environment:

```
git checkout master && git checkout -b staging-sync
./bp pull --url {STAGING_SERVER_URL} --authToken {YOUR_AUTH_TOKEN} --targetDir {TARGET_DIRECTORY}
git commit -am 'sync staging'
```

Then merge the staging changes into the prod changes:

`git checkout prod-sync && git merge staging-sync`

This will create a merge conflict. Use your preferred merge tool to review the changes and resolve the conflicts. Once done, you can publish your branch and create a pull request (if your hosted git allows it), and merge it to master.

Once your master branch is up-to-date, you'll be able to push versions the changes to production with:

`./bp push --url {PROD_SERVER_URL} --authToken {YOUR_AUTH_TOKEN} --targetDir {TARGET_DIRECTORY}`

With these quick tips, you can now promote any environment changes to any stage in your deployment pipeline.

### CLI Commands

To address this issue, we added commands to the CLI. In production, your changes are saved to the database which is persisted between deployments. Botpress CLI gives you two commands: `bp pull` to pull pending changes on your server for all your bots and server-wide files and `bp push` to push your local changes to your server.

You can also head to the **Versioning** tab of your Botpress Admin at https://your.bp.ai/admin/server/version, and Botpress will accurately format the command for you (including your token) for any changes that have been made. Just paste it to your shell, and Botpress will extract the changes in the provided target directory. A successful output should look like the following:

![versioning pull](/assets/versioning-pull.png)

Notice that without any changes, you will see a **You're all set!** message.

:::note
The `BPFS_STORAGE` environment variable must be set to `database` to enable **pushing** to this node.
:::

Please note that `targetDir` and `sourceDir` uses relative paths.

#### Pull

**Binary:**

```bash
./bp pull --url <url> --token <auth_token> --targetDir <remote_data_path>
```

**Docker:**

```bash
docker exec -it <container> bash -c "./bp pull --url <url> --token <auth_token> --targetDir <remote_data_path>"
```

#### Push

**Binary:**

```bash
./bp push --url <url> --token <auth_token> --sourceDir <local_data_path>
```

**Docker:**

```bash
docker exec -it <container> bash -c "./bp push --url <url> --token <auth_token> --sourceDir <local_data_path>"
```
