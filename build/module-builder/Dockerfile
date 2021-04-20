FROM node:12-alpine as builder
WORKDIR /botpress
COPY . botpress

FROM node:12-alpine
# still need git, because of the gulp initStudio task!?
RUN apk add --no-cache git
WORKDIR /botpress
# add botpress source dependencies from builder
# install dependencies
COPY --from=builder ./botpress/botpress/package.json ./botpress/botpress/yarn.lock ./
RUN yarn install
# add build config
COPY --from=builder ./botpress/botpress/build ./build
COPY --from=builder ./botpress/botpress/gulpfile.js ./
# add botpress sdk
COPY --from=builder ./botpress/botpress/src ./src
# add source
COPY --from=builder ./botpress/botpress/modules ./modules
COPY --from=builder ./botpress/botpress/app.json ./app.json
COPY --from=builder ./botpress/botpress/.eslintrc.js ./.eslintrc.js
COPY --from=builder ./botpress/botpress/.tool-versions ./.tool-versions
# add docs
COPY --from=builder ./botpress/botpress/docs ./docs

# TODO move into builder image if possible, expose build/module builder instead
# fully build once, takes 10min+
RUN yarn run gulp build

# build & package module
# TODO extract into entry point, make it reusable to accept a list of modules
#RUN yarn run gulp build:modules --m complete-module
#RUN cd modules/complete-module && yarn && yarn build && yarn package

ENTRYPOINT [ "yarn" ]
CMD [ "run gulp build:modules" ]