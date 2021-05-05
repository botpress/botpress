FROM ubuntu:20.04

ADD . /botpress
WORKDIR /botpress

RUN apt update && \
	apt install -y wget ca-certificates && \
	update-ca-certificates && \
	wget -O duckling https://s3.amazonaws.com/botpress-binaries/duckling-example-exe && \
	wget https://github.com/botpress/nlu/releases/download/v0.0.1-rc.3/nlu-v0_0_1-linux-x64 && \
	chmod +x duckling && \
	chmod +x bp && \
	chmod +x nlu-v0_0_1-linux-x64 && \
	chgrp -R 0 /botpress && \
	chmod -R g=u /botpress && \
	apt install -y tzdata && \
	ln -fs /usr/share/zoneinfo/UTC /etc/localtime && \
	dpkg-reconfigure --frontend noninteractive tzdata && \
	./bp extract


ENV BP_MODULE_NLU_DUCKLINGURL=http://localhost:8000
ENV BP_IS_DOCKER=true
ENV NLU_BIN_DIR=/botpress

ENV LANG=C.UTF-8
EXPOSE 3000

CMD ./duckling & ./bp