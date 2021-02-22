FROM botpress/server:v12_15_2
ADD . /botpress
WORKDIR /botpress
CMD ["./bp"]
