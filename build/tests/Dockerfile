FROM node:12-alpine

ADD . /code
WORKDIR /code

RUN yarn

RUN (cd ./modules/nlu && yarn)

CMD ["yarn", "test"]