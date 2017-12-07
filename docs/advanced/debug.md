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
