FROM node:12-alpine as builder
# git is required to resolve `git+` dependencies
RUN apk add --no-cache git
WORKDIR /botpress
# this builder stage scope also includes additional files required for a full build, 
# e.g.: docs, app.json, .eslintrc.js and .tool-versions
COPY . botpress
# alternatively RUN git clone https://github.com/botpress/botpress.git

# fully build once
RUN cd botpress && yarn install
RUN cd botpress && yarn run gulp build

FROM node:12-alpine
WORKDIR /botpress
# add botpress source dependencies from builder
COPY --from=builder ./botpress/botpress/package.json ./botpress/botpress/yarn.lock ./
# install dependencies
RUN yarn install
# add build config
COPY --from=builder ./botpress/botpress/build ./build
COPY --from=builder ./botpress/botpress/gulpfile.js ./
RUN cd build/module-builder && yarn install
RUN cd build/module-builder && yarn build

# add botpress sdk source & typings
COPY --from=builder ./botpress/botpress/src ./src
# add docs
#COPY --from=builder ./botpress/botpress/docs ./docs
# add source
COPY --from=builder ./botpress/botpress/modules ./modules

# copy built dependencies (up to 300mb)
COPY --from=builder ./botpress/botpress/out ./out

RUN yarn run gulp build:modules

# build & package module
# TODO extract into entry point, make it reusable to accept a list of modules
#RUN yarn run gulp build:modules --m complete-module
#RUN cd modules/complete-module && yarn && yarn build && yarn package

ENTRYPOINT [ "yarn" ]
CMD [ "run gulp build:modules" ]