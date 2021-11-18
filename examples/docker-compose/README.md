# Docker Compose

Those examples allows you to kickstart quickly an installation with all the working pieces together.
There are 4 different setups:

- Community (you can access all services on designed ports)
- Community with nginx (you can only access the bot via nginx, port 80)
- Community with nginx and https (you can only access the bot via nginx, 443)
- Pro
- Pro with nginx
- Basic installation of botpress with docker.

The nginx configuration doesn't include settings for SSL termination, but those are available in the documentation.

Volumes are already configured and your files will be available under the folder botpress/

## Quick Start

1. Visit [Docker Hub](https://cloud.docker.com/u/botpress/repository/docker/botpress/server) to get the latest version
2. Edit `botpress/Dockerfile` and set the latest version
3. If running Pro images, edit `docker-compose-pro.yaml` and set your license key at BP_LICENSE_KEY
4. Type the build command (they are listed below)

### Community

|      Service      | Port | Directly accessible |
| :---------------: | :--: | :-----------------: |
|     Botpress      | 3000 |         Yes         |
|  Language Server  | 3100 |         Yes         |
|  Duckling Server  | 8000 |         Yes         |
| Postgres Database | 5435 |         Yes         |

Command: docker-compose -f docker-compose-community.yaml up --build

Open URL: http://localhost:3000

### Community (with nginx)

|      Service      | Port | Directly accessible |
| :---------------: | :--: | :-----------------: |
|     Botpress      | 3000 |         No          |
|  Language Server  | 3100 |         No          |
|  Duckling Server  | 8000 |         No          |
| Postgres Database | 5435 |         No          |
|       NGINX       |  80  |         Yes         |

Command: docker-compose -f docker-compose-community-nginx.yaml up --build

Open URL: http://localhost:80

### Pro

|      Service      | Port | Directly accessible |
| :---------------: | :--: | :-----------------: |
|     Botpress      | 3000 |         Yes         |
|  Language Server  | 3100 |         Yes         |
|  Duckling Server  | 8000 |         Yes         |
| Postgres Database | 5435 |         Yes         |
|   Redis Server    | 6379 |         Yes         |

Command: docker-compose -f docker-compose-pro.yaml up --build

Open URL: http://localhost:3000

### Pro (with nginx)

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
