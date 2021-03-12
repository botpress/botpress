---
id: Docker
title: Deploying with Docker
---

Docker is a set of platform-as-a-service products that use OS-level virtualization to deliver software in packages called containers.

## Using Remote Duckling & Language Server
This command will run Botpress within a single container and use the remote Duckling and Language Server hosted by us. You can get the latest `stable` or `nightly` versions on [DockerHub](https://hub.docker.com/r/botpress/server/tags).

> You should **never** use `nightly` versions in production because they are unstable.

```
docker run -d \
--name botpress \
-p 3000:3000 \
-v botpress_data:/botpress/data \
botpress/server:$TAG
```

Hosting Duckling and the Language Server is optional. Your Botpress installation will use our hosted services by default.

Choose to either run one of two containers (running two containers is recommended).

### Single Container With All Services

> ⚠️ **Never** run multiple processes inside a single container in production.

This method will run Duckling, the Language Server, and Botpress Server within the same container. It will set some environment variables so that services talk to each other.

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

### Running Multiple Containers
1. Run the Language Server.

```bash
docker run -d \
--name lang \
-p 3100:3100 \
-v botpress_data:/botpress/data \
botpress/server:$TAG \
bash -c "./bp lang --langDir /botpress/data/embeddings"
```

2. Run Botpress Server and Duckling within the same container. Duckling's usage is very light here, so we can justify using it in the same container as Botpress Server.

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

### Restarting Botpess 
You can restart the server from Botpress UI. To achieve this, edit the `botpress.config.json` file from within The Code Editor module (located in the left sidebar). Botpress listens for changes to this config file.

![Restarting Botpress on Docker](assets/docker-restart.png)

After you have edited the botpress.config.json file, save it. You will now see an orange cog at the bottom right corner of the screen:

![Orange Restart Icon](assets/restart-cog.png)

Click that button to restart the server. You can then inspect the logs using docker logs your_container_id.
