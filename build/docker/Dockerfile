FROM ubuntu:18.04

RUN apt update
RUN apt install -y wget ca-certificates
RUN update-ca-certificates

ADD . /botpress
WORKDIR /botpress

RUN wget -O /duckling https://s3.amazonaws.com/botpress-binaries/duckling-example-exe
RUN chmod +x /duckling
RUN apt install -y tzdata && \
	ln -fs /usr/share/zoneinfo/America/New_York /etc/localtime && \
	dpkg-reconfigure --frontend noninteractive tzdata

RUN chmod +x bp
RUN ./bp extract

ENV BP_NLU_DUCKLINGURL=http://localhost:8000
ENV LANG=C.UTF-8
EXPOSE 3000

CMD /duckling & ./bp