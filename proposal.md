DX Enhancements - Command Palette

This change would add a Command Palette, similar to VSCode and other dev tools.
Most commands would be built-in and it would allow modules to register new commands.

### Example of Built-in Shortcuts

- Open bot (one entry for each bot)
- Open Flow Editor
- Navigate to module (one per module)
- Reload module (one per module, if super admin)
- Back to admin
- Content Editor
- Create (Text|Carousel|etc) Element
- Insert Skill (Choice|slot|etc)
- Open documentation for (X)

### Example of Module Shortcuts

- Create new QNA
- Create new intent
- Create new entity
- Open Webchat (open /s/bot_name in new window)

### Implementation for modules

The modification involves adding a `commandPalette` definition to the ModuleEntryPoint. The name of the module would be automatically prepended to the command name.

- Commands with a # sign would be redirected to the module page, and the hash sign would be appended to the URL. The module can then detect the change in the URL and trigger the desired action. (since it's all front-end stuff)
- Setting the command to a complete URL would open a new window

```js
const commandPalette = [
  // Open the module view and append the hash at the end
  { name: 'Create QNA', command: '#createqna' },
  { name: 'Import CSV', command: '#importcsv' },
  { name: 'Export CSV', command: '#exportcsv' },

  // Or, a link to the outside world
  { name: 'Documentation', command: 'https://botpress.io/docs/build/content/' }
]
```
