#FROM botpress/server:v12_15_2
#WORKDIR /botpress
#CMD ["./bp"]

#FROM botpress/server:v12_15_2 as build
#
#ADD . .
#
#WORKDIR /build
#
##COPY ./out/bp/data /botpress/data
##COPY ./out/bp/core/botpress.js /botpress/core/
#
#FROM botpress/server:v12_15_2
#WORKDIR /botpress
#COPY --from=build . .
#CMD ["./bp"]

FROM node:12.20.2
WORKDIR /root/
COPY ./out ./out
COPY ./build ./build
COPY ./modules ./modules
COPY ./envs ./envs
COPY ./app.json .
COPY ./gulpfile.js .
COPY ./metadata.json .
COPY ./.yarnrc .
COPY ./yarn.lock .
ADD package.json package.json
RUN yarn install
CMD ["yarn", "start"]
