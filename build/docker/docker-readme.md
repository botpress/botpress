# Botpress Docker image

## Running Your botpress container

```bash
docker run -d --name=botpress -p 3000:3000 botpress/server
```

### Extra information

There are some predefined defaults. However, you can specify ones via environmental variables:

This example modified the expose port in botpress and add a connection to a postgres database.

```bash
docker run --detach \
           --name=botpress \
           --publish 3000:8080 \
           --volume botpress_data:/botpress/data \
           --env  PORT=8080 \ # Don't forget to adjust "--publish" then
           --env  BP_HOST=0.0.0.0 \ # all zeroes means listen to all interfaces
           --env  NODE_ENV=production \
           --env  PG_HOST=192.168.0.11 \
           --env  PG_PORT=5432 \
           --env  PG_USER=bp_user \
           --env  PG_PASSWORD=<********> \
           --env  PG_SSL=false \
           botpress/server:latest
```

---

Now you can track the logs:

```bash
docker logs --follow botpress
```

---

If you wish to connect to the running container:

```bash
docker exec --interactive --tty botpress bash
```

---

### How to use the botpress container

Further documentation can be found on the botpress [website](https://botpress.com/docs/infrastructure/docker)

### Changelog

Full documentation resource is available on the [official website](https://botpress.com/docs/).
[Changelog resides here](https://github.com/botpress/botpress/blob/master/CHANGELOG.md).
