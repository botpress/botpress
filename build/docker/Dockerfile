FROM ubuntu:20.04

ENV BP_WORKDIR=/botpress
ENV BP_USER=botpress
ENV BP_GROUP=botpress
ENV BP_DATA_PATH $BP_WORKDIR/data

ADD . $BP_WORKDIR
WORKDIR $BP_WORKDIR

RUN apt update && \
	apt install -y wget ca-certificates && \
	update-ca-certificates && \
	wget -O duckling https://s3.amazonaws.com/botpress-binaries/duckling-example-exe && \
	apt install -y tzdata && \
	ln -fs /usr/share/zoneinfo/UTC /etc/localtime && \
	dpkg-reconfigure --frontend noninteractive tzdata

RUN chmod +x duckling && chmod +x bp

RUN ./bp extract

# Creates botpress user and group
RUN groupadd -g 999 $BP_GROUP && \
    useradd -m -r -u 999 -g $BP_GROUP $BP_USER

# Sets ownership of the workdir to the botpress user
RUN chown -R $BP_USER:$BP_GROUP $BP_WORKDIR

ENV BP_MODULE_NLU_DUCKLINGURL=http://localhost:8000
ENV BP_IS_DOCKER=true

ENV LANG=C.UTF-8
EXPOSE 3000

USER $BP_USER

CMD ./duckling & ./bp
