FROM botpress/server:v12_5_0
ADD . /botpress
WORKDIR /botpress
CMD ["./bp"]
