### Local deployment via pure Docker
You can decide whether to pull the image from [Docker Hub](https://hub.docker.com/r/botpress/server/) or create own one.

The former:
```
docker pull botpress/server:latest
```
The latter:
```
docker build --tag botpress --build-arg BP_VERSION=10.17.03 --file ops/Dockerfile .
```

Create persistent storage to keep botpress data:
```
docker volume create botpress_data
```

Start the container with minimal necessary options:
```
docker run --detach \
           --name=botpress \
           --publish 3000:3000 \
           --volume botpress_data:/var/lib/botpress \
           --env  BOTPRESS_DATA_DIR=/var/lib/botpress \
           botpress/server:latest
```

There are some predefined defaults. However, you can specify ones via environmental variables:
```
docker run --detach \
           --name=botpress \
           --publish 3000:8080 \
           --volume botpress_data:/var/lib/botpress \
           --env  BOTPRESS_DATA_DIR=/var/lib/botpress \
           --env  BOTPRESS_PORT=8080 \ # Don't forget to adjust "--publish" then
           --env  NODE_ENV=production \
           --env  BOTPRESS_PASSWORD=<********> \
           --env  PG_HOST=192.168.0.11 \
           --env  PG_PORT=5432 \
           --env  PG_USER=bp_user \
           --env  PG_PASSWORD=<********> \
           --env  PG_SSL=false \
           --env  BP_PLUGINS_INSTALL=analytics,dialog,slack,terminal \
           botpress/server:latest
```

Now you can track the logs:
```
docker logs --follow botpress
```

If you wish to connect to the running container:
```
docker exec --interactive --tty botpress bash
```

___

### Cluster deployment a top of Kubernetes

You can use it on public clouds like AWS/GCE or establish own cloud with Rancher over the bare-metal servers.
No matter what, eventually it will offer you Kubernetes API.
All the changes below do not affect resources mapping - you do it on your own. It is pure Kubernetes

Application prerequisites:
  - [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
  - [ansible](http://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html) v2.5+ (with k8s_raw module)


According to settings Ansible will relay upon .kube/config file settings.
Test if it works:
```
$ kubectl cluster-info
```

Bootstrap the cluster with the appropriate ENV name:
```
$ ansible-playbook ops/ansible/entrypoint.yml --extra-vars "env_type=prod"
```

Get IPs of the published cluster and navigate to it via browser (it should be same namespace that env_type in previous command):
```
$ kubectl get svc --output wide --namespace prod
```

### Bugs:
  - --extra-vars "env_type" is not transmitted to Botpress env NODE_ENV.
    Thus it is always production.
  - Botpress tries to bind to ClusterIP instead of own IP or all of the interfaces.
    This is critical bug.
