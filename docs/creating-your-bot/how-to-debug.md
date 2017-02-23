# How to Debug your bot

Here you find how to configure your favorite IDE to debug your code.

### Visual Studio Code
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
