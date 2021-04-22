FROM node:12-alpine as builder
# git is required to resolve `git+` dependencies
RUN apk add --no-cache git
WORKDIR /botpress
# this builder stage scope also includes additional files required for a full build, 
# e.g.: docs, app.json, .eslintrc.js and .tool-versions
COPY . .
# alternatively RUN git clone https://github.com/botpress/botpress.git .

# fully build once
RUN yarn install
RUN yarn run gulp build

FROM node:12-alpine
WORKDIR /botpress
# add build config
COPY --from=builder ./botpress/build ./build
COPY --from=builder ./botpress/gulpfile.js ./
# add botpress source dependencies
COPY --from=builder ./botpress/package.json ./botpress/yarn.lock ./
# install dependencies
RUN yarn install
RUN cd build/module-builder && yarn install
RUN cd build/module-builder && yarn build

# add botpress sdk source & typings
COPY --from=builder ./botpress/src ./src
# copy built dependencies (up to 300mb)
COPY --from=builder ./botpress/out ./out
# add source
COPY --from=builder ./botpress/modules ./modules


RUN yarn run gulp build:modules

# build & package module
# TODO extract into entry point, make it reusable to accept a list of modules
#RUN yarn run gulp build:modules --m complete-module
#RUN cd modules/complete-module && yarn && yarn build && yarn package

ENTRYPOINT [ "sh", "-c" ]
CMD [ "yarn run gulp build:modules" ]