FROM ubuntu:20.04

ADD . /botpress
WORKDIR /botpress

RUN apt update && \
	apt install -y wget ca-certificates && \
	update-ca-certificates && \
	wget -O duckling https://s3.amazonaws.com/botpress-binaries/duckling-example-exe && \
	apt install -y tzdata && \
	ln -fs /usr/share/zoneinfo/UTC /etc/localtime && \
	dpkg-reconfigure --frontend noninteractive tzdata

RUN chmod +x duckling && \
	chmod +x bp && \
	./bp extract

RUN groupadd -g 999 botpress && \
    useradd -m -r -u 999 -g botpress botpress

RUN chown -R botpress:botpress /botpress

ENV BP_MODULE_NLU_DUCKLINGURL=http://localhost:8000
ENV BP_IS_DOCKER=true

ENV LANG=C.UTF-8
EXPOSE 3000

USER botpress

CMD ./duckling & ./bp