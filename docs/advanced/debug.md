---
layout: guide
---

### Visual Studio Code <a class="toc" id="toc-visual-studio-code" href="#toc-visual-studio-code"></a>
Press f1 and look for launch.json. Inside the "configurations" array, insert the following object:
```json
{
    "type": "node",
    "request": "launch",
    "name": "Launch Program",
    "cwd": "${workspaceRoot}",
    "port": 5859,
    "program": "${workspaceRoot}/node_modules/botpress/bin/botpress",
    "runtimeExecutable": "node",
    "runtimeArgs": [
        "--debug"
    ],
    "args": [ "start" ],
    "stopOnEntry": false
}
```

### Jetbrains IDEs <a class="toc" id="toc-jetbrains" href="#toc-jetbrains"></a>
Open Run > Edit Configurations

Then add a new NodeJS configuration

- Node interpreter: Choose the node interpreter for this project
- Node parameters: Leave empty
- Working directory: /path/to/your/bot
- JavaScript file: `node_modules/botpress/bin/botpress`
- Application parameters: `start`

Save the configuration, you can now use "Run" and "Debug" from your IDE
