**Module registry, Module management & Module config**

Most of changes are UI changes along with some subtl differences on how modules are imported and enabled. Modules will still be imported globally but users will now enable and cofigure them by bot (when defined as scoped module). Further more, a bot template can now define a list of required modules to be configured.

## Modules registry

Modules registry will allow 3rd party module discovery without compromising the botpress repository. All 3rd party modules will be stored as simple json files under the module-registry directory. Each module has its own json file thus preventing naming conflicts. A github module json would look like :

`botpress-github.json`

```json
{
  "name": "botpress-github",
  "description": "Short module description goes here",
  "repositoryUrl": "github.com/communityUser/botpress-github",
  "icon": "base64 encoded icon"
}
```

## Modules management console (import / remove / eventually update)

Admin console will offer a new UI that will act as a basis for our eventual modules registry. It'll feature 4 sections

1- Search bar (for modules discovery) ==> Will be hidden at first and will work with a simple \_.filter at second
2- Search results (list of 10 "most popular" when no search query) that lists potential modules ==> Will simply list all available modules at first
show ui mock up here
3- List of currently installed modules (exact same UI as search result but a remove and update button)
4- A simple button to import custom module (achrive import)

<!-- See mockup in PR -->

## Module scoping

As stated above, modules will now define a `scoped` property meaning that a module has to be configured for each bot that uses it. When `scoped` set to false, the module will be global and used by all bots, this is still necessary as one might want to build/activate a module for all bots with a single configuration (e.g external analytics, authentication, etc.)

A few changes need to be done to make module scoping possible.

1- ModuleLoader should validate the configs before loading the module. Here is some pseudo:

```
await all modules.map(module =>
  if !module.scoped and !moduleLoaded(module.id)
    return loadGlobalModule(module.id)

  moduleconfigs = getModuleConfigsForBot(botId, module.id)
  if module.scoped and isValid(moduleConfigs)
    return loadBotModule(botId, moduleConfigs, module.id)
```

2- Each hook should be called only if module is global or properly configured for bot

**TODO missing specs for this**
Check if the module is enabled / loaded / correctly configured in Hookservice runscript or executeHook

## Required modules for templates

Bot templates can now require modules to be installed and configured before a bot is being enabled. Although most of the time required module will be the module in which the template is defined, a template could require another 3rd party module. At first, when required modules are not installed, we'll simply prompt the user that some required modules are not installed leading to potential affected bot usage. If all required modules are installed, we'll display the configuration form of required modules in the create bot modal (see next).

## Module Configuration UI

Scoped Modules can be configured at 2 different places in the UI (will use same configuration components). Configuration components will at first be a genirc form generated from config json schema, then we might want to generate react code and let the user customize it as he wants.

1- On bot creation, when a module is set as required in a bot template, createBotModal will display a `next` button and will show generated ui for required config (of the required module). Next button will be displayed for each required module. The user can always `skip` and configure the module later.

<!-- See mockup in PR -->

2- The bot configs page will now allow the user to configure each modules. All scoped & installed module are displayed in a side bar list. If a module is not enable, a grey circle is displayed. If a module is enabled and properly configured, a green circle is displayed. If a module is enabled but not fully configured, a red circle is displayed. Module configuration form is the same as in #1 but displays optional fields and module description as well. We might eventually want to point to the module docs / repository but for now we keep this as simple as possible.

<!-- See mockup in PR -->
