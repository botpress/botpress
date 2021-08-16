FROM node:12.13.0 as builder
ENV npm_config_target_platform=linux

COPY . /build
WORKDIR /build

RUN yarn --force --ignore-engines
RUN yarn run build --linux --prod --verbose
RUN yarn run package --linux


FROM ubuntu:20.04
COPY --from=builder /build/packages/bp/binaries /botpress
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

CMD ./duckling & ./bp