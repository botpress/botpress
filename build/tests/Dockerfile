FROM node:12.18.1-alpine

ADD . /code
WORKDIR /code

RUN yarn --frozen-lockfile

RUN (cd ./modules/nlu && yarn --frozen-lockfile)

CMD ["yarn", "test"]
