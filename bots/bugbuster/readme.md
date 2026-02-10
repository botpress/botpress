# Bugbuster

A simple bot built on top of the Botpress [SDK](https://botpress.com/docs/integrations/sdk/overview) that lints Linear issues and synchronizes them with GitHub issues.

<img src="./bugbuster.png" />

## Linear

Once connected to your Linear workspace, the bot comments on newly created or updated issues when linting errors are detected, and automatically resolves those comments once the linting errors are fixed.

The following linting rules are applied (among others):

- An issue must have a title, description, priority, and estimate
- An issue must be linked to a project or have a goal tag
- If an issue is in the _Blocked_ state, it must have either a blocking reason tag or a blocking issue
- If an issue is in the _In Progress_ state, it must have an assignee

## GitHub

Once connected to your GitHub repository, the bot detects new issues and automatically creates a corresponding Linear issue in the Triage state, including all relevant information.
