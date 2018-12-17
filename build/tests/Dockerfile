FROM node:10-alpine

ADD . /code
WORKDIR /code

RUN yarn

RUN (cd ./modules/nlu && yarn)

CMD ["yarn", "test"]