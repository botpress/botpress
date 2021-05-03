FROM node:12-alpine as builder
# git is required to resolve `git+` dependencies
RUN apk add --no-cache git
WORKDIR /botpress
# this builder stage scope also includes additional files required for a full build, 
# e.g.: docs, app.json, .eslintrc.js and .tool-versions
COPY . .
# alternatively RUN git clone https://github.com/botpress/botpress.git .

# fully build once
RUN yarn && yarn build


FROM node:12-alpine

WORKDIR /botpress

# add necessary dependencies
COPY --from=builder ./botpress/build ./build
COPY --from=builder ./botpress/src/typings ./src/typings
COPY --from=builder ./botpress/src/bp/sdk/botpress.d.ts ./src/bp/sdk/botpress.d.ts
COPY --from=builder ./botpress/src/bp/ui-shared/src/typings.d.ts ./src/bp/ui-shared/src/typings.d.ts

COPY --from=builder ./botpress/src/bp/ui-studio/node_modules/@blueprintjs ./src/bp/ui-studio/node_modules/@blueprintjs
COPY --from=builder ./botpress/src/bp/ui-studio/node_modules/react ./src/bp/ui-studio/node_modules/react
COPY --from=builder ./botpress/src/bp/ui-studio/node_modules/@types/react ./src/bp/ui-studio/node_modules/@types/react
COPY --from=builder ./botpress/src/bp/ui-studio/src/web/components/Shared/Interface/typings.d.ts ./src/bp/ui-studio/src/web/components/Shared/Interface/typings.d.ts

COPY --from=builder ./botpress/modules/tsconfig_view.shared.json ./modules/tsconfig_view.shared.json
COPY --from=builder ./botpress/modules/tsconfig.shared.json ./modules/tsconfig.shared.json

COPY --from=builder ./botpress/node_modules/knex ./node_modules/knex
COPY --from=builder ./botpress/node_modules/@types/bluebird-global ./node_modules/@types/bluebird-global
COPY --from=builder ./botpress/node_modules/@types/node ./node_modules/@types/node
COPY --from=builder ./botpress/node_modules/@types/jest ./node_modules/@types/jest
COPY --from=builder ./botpress/node_modules/reflect-metadata ./node_modules/reflect-metadata
COPY --from=builder ./botpress/node_modules/bluebird ./node_modules/bluebird
COPY --from=builder ./botpress/node_modules/express ./node_modules/express

CMD [ "echo", "-e", "Which module would you like to build?\nUse sh -c 'cd modules/your-module && yarn && yarn build && yarn package'" ]