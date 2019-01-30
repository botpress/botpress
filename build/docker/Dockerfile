FROM ubuntu:18.04
ADD . /botpress
WORKDIR /botpress
RUN chmod +x bp
RUN ./bp extract
EXPOSE 3000
CMD ["./bp"]