# Ghost Content Design Document

Ghost Content is the term referencing the generic approach implemented for managing different types of content, including content types (forms), flows, and potentially others.

## The problem

There are certain parts of the bot code that may change more often than the bot's code.
For such parts it's often common for less technical members of the team, or for engineers who simply prefer faster feedback cycles, to use the GUI tools to manage the content and observe the behaviour change on the live bot.
At the moment Botpress provides two such features:
* Content Manager
* Flow Editor

Both let you change the files that belong to the bot code through the help of the UI in the Botpress admin panel.

This all works good before you want to deploy the new version of your bot (including some code changes made by the developers).

It opens two problems:
1) certain hosting platforms (including Heroku, or Google Cloud, or any Docker-based deployment pipeline) will package the new version of your code as a comleteley new container. Which means all of your changes to the local files is gone as soon as you make the new successful deployment (the old container is shut down and thrown away)
2) What if your updated version of the code has some changes to the same content files that have been edited on the server through the UI.

Ghost Content feature is designed to answer both questions.

## Feature overview

With the introduction of the feature the botpress server behaves like that:
* all changes are not saved to the files anymore, instead they go to the database. This DB is referred to as the ghost version of the content from the files
* each change gets its unique random UUID recorded in the DB
* the repository also contains the list of UUIDs (in a file) indicating which of these changes were already incorporated back into the codebase (see below how)
* all parts that need to read from the content files now _always_ read the ghost version from the DB
* upon server start the following actions are taken:
  * the server finds all the revisions IDs still in the DB
  * it parses the UUIDs list from the bot code and deletes from the DB the IDs that are already in that file
  * if there are any IDs remaining in the DB the server generates persisted alert shown in the Botpress admin panel instructing the user to fetch the ghost content and merge it into the source code of their bot (see below how)
  * otherwise (if all the revisions are said to be reflected in the sources already) the server reads the corresponding files and saves their content to the ghost content DB (which makes it effectively available to the running application)
* how the ghost content can be incorporated back into the bot's source code:
  * the main secenario is using the botpress CLI, it will get the package from the server API, and add all the IDs to the UUIDs list, dump the new content into its place in the bot source code directory
  * alternatively the UI may eventually be present with download links, but it's not likely to happen in the first order
