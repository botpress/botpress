Instructions on how to use Botpress with external services

## NLU

1. (Optional) Launch a local lang server and Duckling server as described in the [documentation](https://botpress.com/docs/infrastructure/hosting#language-server).
2. Launch a local nlu server using command `./bp nlu`. You can specify which language server to use along with many other options trough the CLI. To learn more about valid CLI parameters launch `./bp nlu --help`.

   **Important ⚠️** Make sure your NLU server is not accessible publicly.

3. Launch Botpress using environment variable `NLU_ENDPOINT` pointing to your local nlu server.

### CLustering the NLU Server

If you plan on training many bots simultanuously or if you plan on receiving a high volume of requests, you can host your NLU Server in a multi-node fashion.

To do so, launch multiple nlu-server instances using the CLI argument `--dbURL postgres://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/YOUR_DATABASE`.

NLU server can both share the same database as Botpress (this is the default behavior), or use a separate dedicated database to store models and training information.

All your NLU Server instances must then be handled by a load balancer.

Here's a summary of all possible and valid NLU Server configuration:

<img src="./nlu-server-setup.png"/>

## Messaging
