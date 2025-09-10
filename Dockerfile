FROM node:22

# Install rsync
RUN apt-get update && apt-get install -y rsync

ENV NODE_ENV=production


WORKDIR /usr/src/app
COPY .yarn/releases .yarn/releases
COPY .yarnrc.yml yarn.lock package.json ./

RUN yarn install --immutable

# Load the cache from the previous build
#RUN --mount=type=cache,target=/yarn-cache \
#     rsync -a /yarn-cache/ .yarn/cache/ \
#  && yarn install --immutable \
#  && rsync -a .yarn/cache/ /yarn-cache

# # Remove rsync
RUN apt-get remove -y rsync

# # Now we can run the full copy command

COPY . ./

ENV NODE_ENV=production

RUN yarn run build

EXPOSE 3000

ENV NODE_NO_WARNINGS=1

CMD ["yarn", "run", "server"]
