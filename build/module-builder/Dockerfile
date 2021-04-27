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
# add build config & dependencies
COPY --from=builder ./botpress/build ./build
COPY --from=builder ./botpress/gulpfile.js ./botpress/metadata.json ./botpress/package.json ./botpress/yarn.lock ./
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

# prebuild other modules
RUN yarn run gulp build:modules

#Test1

CMD [ "echo", "-e", "Which module would you like to build?\nUse sh -c 'cd modules/your-module && yarn && yarn build && yarn package'" ]