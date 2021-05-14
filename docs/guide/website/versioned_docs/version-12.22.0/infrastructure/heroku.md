---
id: version-12.22.0-heroku
title: Deploying to Heroku
original_id: heroku
---
Heroku is a platform as a service (PaaS) that enables developers to build, run, and operate applications entirely in the cloud.

## Prerequisites

- If you don't already have a Heroku account, you can create one for free [here](https://signup.heroku.com).
- Install the Heroku CLI by following [these instructions](https://devcenter.heroku.com/articles/heroku-cli).
- Install and run [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Type `heroku login` in your terminal to log in to Heroku.

## Preparing the Docker image

To create a new chatbot from scratch, create a file named `Dockerfile` in any directory (Make sure your Dockerfile is really called Dockerfile, not “Dockerfile.txt”). Write this snippet in the file (and replace \$VERSION with the latest one in [hub.docker.com](https://hub.docker.com/r/botpress/server/tags/))

```docker
FROM botpress/server:$VERSION
WORKDIR /botpress
CMD ["/bin/bash", "-c", "./duckling & ./bp"]
```

Make sure Docker is running on your computer. Then open a command prompt and type these commands:

```bash
# This will create a new app with a random name. Copy the name because we'll need it later
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

## Deploying with existing data

If you have already built a chatbot and want to host it on Heroku, add your `data` folder in the same folder as the `Dockerfile`. The structure should look like this:

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

## Using Postgres as the database

By default, Botpress uses SQLite as a database for persistence, and that doesn't work well on Heroku because it has ephemeral storage, which means data will get lost frequently. The best is to switch the database to Postgres (please make sure you are using Postgres 9.5 or higher):

```bash
# Get a free Postgres database
heroku addons:create heroku-postgresql --app $APP_NAME

# Tell Botpress to use Postgres
heroku config:set DATABASE=postgres --app $APP_NAME
```

You don't have to change anything else since Heroku will define the DATABASE_URL environment variable with the required parameters. It is also possible to find your Postgres credentials on the Heroku dashboard: Overview > Heroku Postgres > Settings > View Credentials.

## Sample Heroku Deployment

Below is an example of a succesfull deployment of Botpress on Heroku:

```
User@DESKTOP-T1ORLFU MINGW64 /c/Botpress/heroku
$ heroku create
Creating app... done, cryptic-river-32436
https://cryptic-river-32436.herokuapp.com/ | https://git.heroku.com/cryptic-river-32436.git

User@DESKTOP-T1ORLFU MINGW64 /c/Botpress/heroku
$ heroku container:login
Login Succeeded

User@DESKTOP-T1ORLFU MINGW64 /c/Botpress/heroku
$ heroku container:push web --app cryptic-river-32436
=== Building web (C:\Botpress\heroku\Dockerfile)
#1 [internal] load build definition from Dockerfile
#1 sha256:d64e3124292aa0bdcc7d7b5dc2cb5fb4f1822fde67a2038617f5143dbfc354b5
#1 transferring dockerfile:
#1 transferring dockerfile: 131B 0.1s done
#1 DONE 1.6s

#2 [internal] load .dockerignore
#2 sha256:bb5050d64b6da36e7b6e71946e3a66774769a90e2fc936b43f6facda2408efc9
#2 transferring context: 2B 0.0s done
#2 DONE 1.7s

#3 [internal] load metadata for docker.io/botpress/server:v12_16_3
#3 sha256:c3bf06afd4744d4a68f507772135c2107267f1ec8d1cd0e1f73a17fb417ab855
#3 DONE 9.2s

#4 [1/2] FROM docker.io/botpress/server:v12_16_3@sha256:d34d9442e31f1e302f583e51dd570bd01557f2660d03d37ac7258e97778004d1
#4 sha256:2a86f7e49820cc22e84f152aecd752dc973e93eb45398c04b758ba40f57e3a4e
#4 resolve docker.io/botpress/server:v12_16_3@sha256:d34d9442e31f1e302f583e51dd570bd01557f2660d03d37ac7258e97778004d1
#4 resolve docker.io/botpress/server:v12_16_3@sha256:d34d9442e31f1e302f583e51dd570bd01557f2660d03d37ac7258e97778004d1 0.2s done
#4 sha256:d34d9442e31f1e302f583e51dd570bd01557f2660d03d37ac7258e97778004d1 1.58kB / 1.58kB done
#4 sha256:253e2ffcafd1c865e58cae9060283de4c0415cab07b31594d9f1760a9aafda90 5.39kB / 5.39kB done
#4 sha256:24f1a4a01e73db722964993836a979a11ac99962fdbc767a2625870081e68fdb 212.85MB / 212.85MB 242.2s done
#4 sha256:bc9679dcb374f54eb87e9f114ae791481660e581c69868d29a5c2c4c335b6fbd 196.08MB / 381.93MB 244.7s
#4 extracting sha256:24f1a4a01e73db722964993836a979a11ac99962fdbc767a2625870081e68fdb 4.2s done
#4 sha256:bc9679dcb374f54eb87e9f114ae791481660e581c69868d29a5c2c4c335b6fbd 381.93MB / 381.93MB 387.4s done
#4 extracting sha256:bc9679dcb374f54eb87e9f114ae791481660e581c69868d29a5c2c4c335b6fbd 23.5s done
#4 DONE 431.3s

#5 [2/2] WORKDIR /botpress
#5 sha256:26296f10a69185047dbb01187f38df7a8d6822c10836a1050406c1165f5e2b6e
#5 DONE 1.4s

#6 exporting to image
#6 sha256:e8c613e07b0b7ff33893b694f7759a10d42e180f2b4dc349fb57dc6b71dcab00
#6 exporting layers
#6 exporting layers 0.7s done
#6 writing image sha256:ea7473a7c0ba4a08d984ebb294bc45599b37fd00c8de7fd6e0e813ef482de628
#6 writing image sha256:ea7473a7c0ba4a08d984ebb294bc45599b37fd00c8de7fd6e0e813ef482de628 0.1s done
#6 naming to registry.heroku.com/cryptic-river-32436/web 0.1s done
#6 DONE 1.1s
=== Pushing web (C:\Botpress\heroku\Dockerfile)
Using default tag: latest
The push refers to repository [registry.heroku.com/cryptic-river-32436/web]
5f70bf18a086: Preparing
0c82c1e66449: Preparing
dc08b077f763: Preparing
b9b7103af585: Preparing
ca2991e4676c: Preparing
a768c3f3878e: Preparing
bc7f4b25d0ae: Preparing
a768c3f3878e: Waiting
bc7f4b25d0ae: Waiting
dc08b077f763: Layer already exists
5f70bf18a086: Layer already exists
0c82c1e66449: Layer already exists
b9b7103af585: Layer already exists
ca2991e4676c: Layer already exists
a768c3f3878e: Layer already exists
bc7f4b25d0ae: Layer already exists
latest: digest: sha256:530f5448992610b064ed57fffc4429ad9e287b1e913d5b4534cd3c96fc47805e size: 1782
Your image has been successfully pushed. You can now release it with the 'container:release' command.

User@DESKTOP-T1ORLFU MINGW64 /c/Botpress/heroku
$ heroku container:release web --app cryptic-river-32436
Releasing images web to cryptic-river-32436... done

User@DESKTOP-T1ORLFU MINGW64 /c/Botpress/heroku
$ heroku container:release web --app cryptic-river-32436
Releasing images web to cryptic-river-32436... done

User@DESKTOP-T1ORLFU MINGW64 /c/Botpress/heroku
$ heroku addons:create heroku-postgresql --app cryptic-river-32436
Creating heroku-postgresql on cryptic-river-32436... free
Database has been created and is available
 ! This database is empty. If upgrading, you can transfer
 ! data from another database with pg:copy
Created postgresql-triangular-14881 as DATABASE_URL
Use heroku addons:docs heroku-postgresql to view documentation

User@DESKTOP-T1ORLFU MINGW64 /c/Botpress/heroku
$ heroku config:set DATABASE=postgres --app cryptic-river-32436
Setting DATABASE and restarting cryptic-river-32436... done, v6
DATABASE: postgres
```
