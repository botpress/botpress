FROM node:12-alpine
WORKDIR /botpress
# install dependencies
ADD ./package.json ./yarn.lock ./
RUN yarn install
# add build config
ADD ./build ./build
ADD ./gulpfile.js ./
# add source
ADD ./modules ./modules
# add botpress sdk
ADD ./src ./src

# build & package module
# TODO extract into entry point, make it reusable to accept a list of modules
RUN yarn run gulp build:modules --m complete-module
RUN cd modules/complete-module && yarn && yarn build && yarn package

ENTRYPOINT [ "yarn" ]
CMD [ "run gulp build:modules" ]