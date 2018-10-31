FROM ubuntu:18.04
ADD . /botpress
WORKDIR /botpress
RUN chmod +x bp
WORKDIR /botpress/modules
RUN for file in `ls -1 *.tgz`; do mkdir ${file%.*} |tar -zxf $file -C ${file%.*}; done
RUN rm -rf *.tgz
WORKDIR /botpress
EXPOSE 3001
CMD ["./bp"]