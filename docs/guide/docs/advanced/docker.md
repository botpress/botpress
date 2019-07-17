---
id: docker
title: Docker
---

## Online Acccess

If the server you're running Botpress from has access to Internet, you can run this docker command. This will run within a single container and use our hosted Language Server:

```
docker run -d --name botpress -p 3000:3000 botpress/server:v12_0_2
```

## Offline Access

For servers without or with limited Internet access, you'll have to run the Language Server and download the language models.

1. Choose to either run one of two containers (two containers is recommended)
1. Download the language models of your choice

### Running Multiple Containers

1. Run the Language Server.

```bash
docker run -d --name lang -p 3100:3100 botpress/server:v12_0_2 bash -c "./bp lang --dim 300 --langDir /botpress/data/embeddings"
```

2. Run Botpress Server and Duckling within the same container. The usage of Duckling is very light here so we can justify using it in the same container as Botpress Server.

```bash
docker run -d --name bp -p 3000:3000 -e BP_MODULE_NLU_LANGUAGESOURCES='[{ "endpoint": "http://localhost:3100" }]' botpress/server:v12_0_2 bash -c "./duckling & ./bp"
```

### Running a Single Container

> ⚠️ Running multiple processes inside a single container should **never** be done in production.

This will run Duckling, the Language Server and Botpress Server within the same container. It will set some environment variables so that services talk to each other.

```bash
docker run -d --name bp \
--env BP_MODULE_NLU_LANGUAGESOURCES='[{ "endpoint": "http://localhost:3100" }]' \
-p 3000:3000 -p 3100:3100 botpress/server:v12_0_2 \
bash -c "./duckling & ./bp lang --dim 300 --langDir /botpress/data/embeddings & ./bp"
```

### Download Language Models

1. Download this file: https://botpress-public.nyc3.digitaloceanspaces.com/embeddings/index.json
1. Download the `bpe` and `embeddings` files corresponding to your languages. For instance, for french, download the `bp.fr.bpe.model` file located under `remoteUrl` and the `bp.fr.300.bin` also located under `remoteUrl`.
1. Once the files are downloaded, place them under the `/botpress/data/embeddings/` folder of your container.

> **Note**: `300` is the number of dimensions the model has. More dimensions means the model size is bigger. You can choose a lighter model if your server specs are limited, but keep in mind that you need to change the `--dim` parameter when you start the Language Server (e.g. `./bp lang --dim <number>`).
