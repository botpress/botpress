![botpress](https://botpress.io/blog/content/images/2017/06/xnobg_primary_black.png.pagespeed.ic.siY4jfFl48.png)

### Installation

Create persistent storage to keep botpress data:

```bash
docker volume create botpress_data
```

---

Start the container with minimal necessary options:

```bash
docker run --detach \
           --name=botpress \
           --publish 3001:3001 \
           --volume botpress_data:/botpress/data \
           botpress/server:latest
```

---

There are some predefined defaults. However, you can specify ones via environmental variables:

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

Full documentation resource is available on the [official website](https://botpress.io/docs/).
[Changelog resides here](https://github.com/botpress/botpress/blob/master/CHANGELOG.md).
