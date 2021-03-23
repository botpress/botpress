---
id: development-pipeline
title: Development Pipelines
---

## Workflow

A best practice is to keep the changes of your bots in your prefered Source Control Management tool (e.g Git) and always deploy the master branch in production. Once deployed, you can regularly [pull](../infrastructure/versions#pull) changes and apply them to your SCM or revert them at any moment. With this tip you can harness the power of your SCM for branches, merge conflicted files, review changes and create revisions.

Fine, now what if you have a more complex deployment pipeline with a(or multiple) staging environment with pending changes on each environment? That's what we'll learn next.

## Development Pipelines

In this section, we will use Git to sync changes between 2 environments and promote an environment (i.e. promote staging to production).

Given a pipeline with 3 environments, **development**, **staging** and **production**. Let's say there are some changes both on production and staging and you want to promote staging to production. What we want to do is the following:

1. Create a merge conflict so we can choose what we want in a merge conflict tool.
1. Resolve conflicts (i.e merge staging into production)
1. Push the results to master so it can be deployed to your production environment.

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

This will create a merge conflict, use your prefered merge tool to review the changes and resolve the conflicts. Once its done, you will be able to publish your branch and create a pull request (if your hosted git allows it) and merge it to master.

Once your master branch is up-to-date, you'll be able to [push](../infrastructure/versions#push) the changes to production with:

`./bp push --url {PROD_SERVER_URL} --authToken {YOUR_AUTH_TOKEN} --targetDir {TARGET_DIRECTORY}`

With these quick tips you can now promote any environment changes to any stage in your deployment pipeline.
