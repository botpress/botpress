FROM botpress/node:v8.9.0

EXPOSE 3000/tcp

ARG BP_VERSION

ENV BOTPRESS_DIR /usr/share/botpress

RUN apk update
RUN apk add bash jq

RUN apk add make gcc g++ python python-dev

RUN yarn global add botpress@${BP_VERSION}

WORKDIR ${BOTPRESS_DIR}

# TODO: https://github.com/botpress/botpress/issues/623
RUN botpress init --yes
RUN mv -- --yes/* .
RUN rm -rf -- --yes
# end of TODO

RUN jq '.name = $newName' --arg newName 'mybot' package.json > tmp.$$.json && mv tmp.$$.json package.json
# Change dependency
RUN jq '.dependencies["botpress"] = $newVersion' --arg newVersion "${BP_VERSION}" package.json > tmp.$$.json && mv tmp.$$.json package.json
RUN jq '.dependencies["@botpress/channel-web"] = $newVersion' --arg newVersion $(echo "${BP_VERSION}" | cut -d. -f-2 ) package.json > tmp.$$.json && mv tmp.$$.json package.json

RUN yarn install --only=production
RUN yarn cache clean

RUN apk del make gcc g++ python python-dev

COPY ./run.sh /usr/bin 
RUN chmod +x /usr/bin/run.sh
WORKDIR ${BOTPRESS_DIR}
CMD ["run.sh"]
