FROM node:22 AS builder

# Install rsync
# RUN apt-get update && apt-get install -y rsync

ENV NODE_ENV=production

WORKDIR /usr/src/build
COPY .yarn/releases .yarn/releases
COPY .yarnrc.yml yarn.lock package.json ./

RUN yarn install --immutable

# Load the cache from the previous build
#RUN --mount=type=cache,target=/yarn-cache \
#     rsync -a /yarn-cache/ .yarn/cache/ \
#  && yarn install --immutable \
#  && rsync -a .yarn/cache/ /yarn-cache

# # Remove rsync
# RUN apt-get remove -y rsync

# # Now we can run the full copy command

COPY . ./

ENV NODE_ENV=production

RUN yarn run build

# TODO: we could slim things down by removing
# dev dependencies here...

EXPOSE 3000

ENV NODE_NO_WARNINGS=1

CMD ["yarn", "node", "dist/server/index.mjs"]
