FROM ubuntu
RUN apt-get update && apt-get install unzip
ADD . /botpress
WORKDIR /botpress
RUN unzip *.zip 
RUN rm -rf *.zip
RUN chmod +x bp
WORKDIR /botpress/modules
RUN for file in `ls -1 *.tgz`; do mkdir ${file%.*} |tar -zxf $file -C ${file%.*}; done
RUN rm -rf *.tgz
WORKDIR /botpress
EXPOSE 3001
CMD ["./bp"]