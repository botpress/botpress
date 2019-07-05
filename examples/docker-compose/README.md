## Docker Compose

Those examples allows you to kickstart quickly an installation with all the working pieces together.
There are 4 different setup:

- Community (you can access all services on designed ports)
- Community with nginx (you can only access the bot via nginx, port 80)
- Pro
- Pro with nginx

The nginx configuration doesn't include settings for SSL, but those are available on the documentation

Before typing any of the commands below, edit botpress/Dockerfile and set the latest version for the image. Volumes are already configured and your files will be available under the folder botpress/

\*\* For Pro editions, you need to set your license key in the docker-compose file prior to execution

### Community - Dev

|      Service      | Port | Directly accessible |
| :---------------: | :--: | :-----------------: |
|     Botpress      | 3000 |         Yes         |
|  Language Server  | 3100 |         Yes         |
|  Duckling Server  | 8000 |         Yes         |
| Postgres Database | 5435 |         Yes         |

Command: docker-compose -f docker-compose-community.yaml up --build
Open URL: http://localhost:3000

### Community - Prod

|      Service      | Port | Directly accessible |
| :---------------: | :--: | :-----------------: |
|     Botpress      | 3000 |         No          |
|  Language Server  | 3100 |         No          |
|  Duckling Server  | 8000 |         No          |
| Postgres Database | 5435 |         No          |
|       NGINX       |  80  |         Yes         |

Command: docker-compose -f docker-compose-community-nginx.yaml up --build
Open URL: http://localhost:80

### Pro - Dev

|      Service      | Port | Directly accessible |
| :---------------: | :--: | :-----------------: |
|     Botpress      | 3000 |         Yes         |
|  Language Server  | 3100 |         Yes         |
|  Duckling Server  | 8000 |         Yes         |
| Postgres Database | 5435 |         Yes         |
|   Redis Server    | 6379 |         Yes         |

Command: docker-compose -f docker-compose-pro.yaml up --build
Open URL: http://localhost:3000

### Pro - Prod

|      Service      | Port | Directly accessible |
| :---------------: | :--: | :-----------------: |
|     Botpress      | 3000 |         No          |
|  Language Server  | 3100 |         No          |
|  Duckling Server  | 8000 |         No          |
| Postgres Database | 5435 |         No          |
|   Redis Server    | 6379 |         No          |
|       NGINX       |  80  |         Yes         |

Command: docker-compose -f docker-compose-pro-nginx.yaml up --build
Open URL: http://localhost:80
