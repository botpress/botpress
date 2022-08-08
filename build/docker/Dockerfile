FROM ubuntu:20.04

ADD . /botpress
WORKDIR /botpress

RUN apt update && \
	apt install -y wget ca-certificates && \
	update-ca-certificates && \
	wget -O duckling https://s3.amazonaws.com/botpress-binaries/duckling-example-exe && \
	chmod +x duckling && \
	chmod +x bp && \
	chgrp -R 0 /botpress && \
	chmod -R g=u /botpress && \
	apt install -y tzdata && \
	ln -fs /usr/share/zoneinfo/UTC /etc/localtime && \
	dpkg-reconfigure --frontend noninteractive tzdata && \
	./bp extract


ENV BP_MODULE_NLU_DUCKLINGURL=http://localhost:8000
ENV BP_IS_DOCKER=true

ENV LANG=C.UTF-8
EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/
ENTRYPOINT ["docker-entrypoint.sh"]

# '-p' preserves the environment variables when login in the new shell.
# That's why we need to re-define the HOME and PWD variables.
CMD su -p botpress -c "HOME=/home/$BP_USER; PWD=/home/$BP_USER && $BP_WORKDIR/duckling & $BP_WORKDIR/bp"
