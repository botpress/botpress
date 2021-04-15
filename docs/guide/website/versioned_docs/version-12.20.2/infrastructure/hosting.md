---
id: version-12.20.2-hosting
title: Hosting
original_id: hosting
---

## Overview

When you are ready to open your bot to the world, you should deploy it in production mode. When the bot is started in production, the botpress file system (BPFS) is enabled [click here for more details](versions) and debug logs are no longer displayed. We also **strongly** recommend using PostgreSQL instead of the embedded SQLite.

## Offline Servers

Botpress communicates with two services in order to work properly (i.e. Duckling and a Language Server). If your Botpress installation has **no internet** access, you'll have to host these services on-prem. When following the different hosting methods, look for a section on on-prem hosting for further details.

### Duckling

We use Duckling to extract system entities (e.g. time, email, currency, etc.). This service is very light and requires minimal resources.

### Language Server

The Language Server is used to provide the language models necessary to run the NLU.

By default, the Language Server is configured to get `100` dimensions for words. If you plan to use that Language Server in production, we highly recommend setting the dimensions to `300` for a better vocabulary.

| Dimensions | RAM Usage \* | Disk Usage \* |
| ---------- | ------------ | ------------- |
| 100        | ~1.3 Gb      | ~900 Mb       |
| 300        | ~3.5 Gb      | ~3 Gb         |

\* Per language

1. Open this metadata file: https://botpress-public.nyc3.digitaloceanspaces.com/embeddings/index.json
1. Download the `bpe` and `embeddings` files corresponding to your languages. For instance, for french, download the `bp.fr.bpe.model` file located under `remoteUrl` and the `bp.fr.300.bin` also located under `remoteUrl`.
1. Once the files are downloaded, place them somewhere on your server filesystem and take note of the path.
1. Add the `--offline` and the `--dim <number>` arguments to your command when starting the language server. i.e. `./bp lang --offline --dim <number> --langDir <some_path>`. Make sure that the dimension argument match the dimensions of the models you have downloaded e.g. `bp.en.300.bin`.

> **Note**: `300` is the number of dimensions the model has. More dimensions means the model size is bigger. You can choose a lighter model if your server specs are limited, but keep in mind that you need to change the `--dim` parameter when you start the Language Server (e.g. `./bp lang --dim <number>`).

| Abbreviation | Language   |
| ------------ | ---------- |
| ar           | Arabic     |
| en           | English    |
| fr           | French     |
| ja           | Japanese   |
| pt           | Portuguese |
| ru           | Russian    |
| de           | German     |
| es           | Spanish    |
| he           | Hebrew     |
| it           | Italian    |
| nl           | Dutch      |
| pl           | Polish     |

## Binary

Run the following command in your command line:

```bash
EXTERNAL_URL=<public_url> \
BP_PRODUCTION=true \
BPFS_STORAGE=database \
DATABASE_URL=postgres://login:password@host:port/database \
./bp
```

### Hosting Duckling and the Language Server

This step is optional. Your Botpress installation will use our hosted services by default.

#### Duckling

When you have the duckling binary, simply edit the file `data/global/config/nlu.json` and set the parameter `ducklingURL` to where you run Duckling, for example, if it's on the same server as Botpress (and if you use the default port of `8000`), you would set:

```js
{
  ...
  "ducklingURL": "http://localhost:8000"
}
```

- **Linux and Mac**: Duckling must be compiled to run correctly on your specific system. Therefore, you will need to install the software development tools and build it from source.
  Please follow the instructions on the [GitHub page of Duckling](https://github.com/facebook/duckling). We may provide some binaries in the future for common OS.

- **Windows**: If you run Botpress on windows, there is a zip file available [here](https://s3.amazonaws.com/botpress-binaries/tools/duckling/duckling-windows.zip).
  Simply double-click on run-duckling.bat (the bat file simply sets the code page of the console to UTF-8, then runs the executable). The folder `zoneinfo` includes the Olson timezones which are already available by default on other OS.

#### Language Server

The language server is embedded in Botpress and can be started by command line. Here are the steps to run it and use it with your Botpress Server:

1. Start the language server with `./bp lang`
2. In `data/global/config/nlu.json`, change `languageSources.endpoint` to `http://localhost:3100`
3. Restart Botpress and open the Languages page on the Admin Panel
4. Install the desired languages your server should support
5. Restart the language server with parameters `./bp lang --readOnly`

ReadOnly prevents anyone from adding or removing languages and can only be used to fetch embeddings. There are additional parameters that can be configured (for example, to require authentication), you can see them by typing `./bp lang help`.

**Offline Server**: Follow the Offline Server [instructions](#offline-servers) if you're running a server without Internet access.

## Docker

This command will run Botpress within a single container and use the remote Duckling and Language Server. You can get the latest `stable` or `nightly` versions on [DockerHub](https://hub.docker.com/r/botpress/server/tags).

> `nightly` versions are unstable and should **not** be used in production.

```
docker run -d \
--name botpress \
-p 3000:3000 \
-v botpress_data:/botpress/data \
botpress/server:$TAG
```

### Hosting Duckling and the Language Server

This step is optional. Your Botpress installation will use our hosted services by default.

Choose to either run one of two containers (two containers is recommended).

#### Running a Single Container

> ⚠️ Running multiple processes inside a single container should **never** be done in production.

This will run Duckling, the Language Server and Botpress Server within the same container. It will set some environment variables so that services talk to each other.

```bash
docker run -d \
--name bp \
-p 3000:3000 -p 3100:3100 \
-v botpress_data:/botpress/data \
-e BP_MODULE_NLU_LANGUAGESOURCES='[{ "endpoint": "http://localhost:3100" }]' \
botpress/server:$TAG \
bash -c "./duckling & ./bp lang --langDir /botpress/data/embeddings & ./bp"
```

**Offline Server**: Follow the Offline Server [instructions](#offline-servers) if you're running a server without Internet access.

#### Running Multiple Containers

1. Run the Language Server.

```bash
docker run -d \
--name lang \
-p 3100:3100 \
-v botpress_data:/botpress/data \
botpress/server:$TAG \
bash -c "./bp lang --langDir /botpress/data/embeddings"
```

2. Run Botpress Server and Duckling within the same container. The usage of Duckling is very light here so we can justify using it in the same container as Botpress Server.

```bash
docker run -d \
--name bp \
-p 3000:3000 \
-v botpress_data:/botpress/data \
-e BP_MODULE_NLU_LANGUAGESOURCES='[{ "endpoint": "http://localhost:3100" }]' \
botpress/server:$TAG \
bash -c "./duckling & ./bp"
```

**Offline Server**: Follow the Offline Server [instructions](#offline-servers) if you're running a server without Internet access.

## Heroku

### Prerequisite

- If you don't already have a Heroku account, you can create one for free [here](https://signup.heroku.com).
- Install the Heroku CLI by following [these instructions](https://devcenter.heroku.com/articles/heroku-cli).
- Type `heroku login` in your terminal to log in to Heroku.

### Preparing the Docker image

To create a new bot from scratch, simply create a file named `Dockerfile` in any directory. Write this snippet in the file (and replace \$VERSION with the latest one in [hub.docker.com](https://hub.docker.com/r/botpress/server/tags/))

```docker
FROM botpress/server:$VERSION
WORKDIR /botpress
CMD ["/bin/bash", "-c", "./duckling & ./bp"]
```

Make sure Docker is running on your computer. Then open a command prompt and type these commands:

```bash
# This will create a new app with a random name. Copy the name, we'll need it later
heroku create

# Creating app... done, ⬢ glacial-inlet-29943
# https://glacial-inlet-29943.herokuapp.com/ | https://git.heroku.com/glacial-inlet-29943.git

# Login to the container registry
heroku container:login

# This uses your Dockerfile to build the image.
heroku container:push web --app $APP_NAME

# This is the last step, your bot will be available at https://$APP_NAME.herokuapp.com/
heroku container:release web --app $APP_NAME
```

### Deploying with existing data

If you have already built a bot and want to host it on Heroku, add your `data` folder in the same folder as the `Dockerfile`. The structure should look like this:

```bash
my-new-bot
├── Dockerfile
└── data
    ├── bots
    └── global
```

Edit the `Dockerfile` so it looks like this, then deploy it with the same instructions as before:

```docker
FROM botpress/server:$VERSION
ADD . /botpress
WORKDIR /botpress
CMD ["./bp"]
```

### Using Postgres as the database

By default, Botpress uses SQLite as a database for persistence. This doesn't work well on Heroku because it has ephemeral storage, which means data will get lost every day or so. The best is to switch the database to Postgres (please make sure you are using Postgres 9.5 or higher):

```bash
# Get a free Postgres database
heroku addons:create heroku-postgresql --app $APP_NAME

# Tell Botpress to use Postgres
heroku config:set DATABASE=postgres --app $APP_NAME
```

You don't have to change anything else, since Heroku will define the DATABASE_URL environment variable with the required parameters. It is also possible to find your Postgres credentials on the Heroku dashboard: Overview > Heroku Postgres > Settings > View Credentials.
