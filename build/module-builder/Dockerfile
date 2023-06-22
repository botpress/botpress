FROM node:12.22.10-alpine as builder
# git is required to resolve `git+` dependencies
RUN apk add --no-cache git
WORKDIR /botpress
# this builder stage scope also includes additional files required for a full build, 
# e.g.: docs, app.json, .eslintrc.js and .tool-versions
COPY . .
# alternatively RUN git clone https://github.com/botpress/v12.git .

# fully build once
RUN yarn --frozen-lockfile && yarn build


FROM node:12.22.10-alpine

WORKDIR /botpress

# add necessary dependencies
COPY --from=builder ./botpress/build ./build

COPY --from=builder ./botpress/modules/tsconfig_view.shared.json ./modules/tsconfig_view.shared.json
COPY --from=builder ./botpress/modules/tsconfig.shared.json ./modules/tsconfig.shared.json

COPY --from=builder ./botpress/node_modules ./node_modules
COPY --from=builder ./botpress/packages ./packages

CMD [ "echo", "-e", "Which module would you like to build?\nUse sh -c 'cd modules/your-module && yarn && yarn build && yarn package'" ]