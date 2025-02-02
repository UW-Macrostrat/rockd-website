# Rockd website

This is the code for Version 2 of Rockd's website, which replaced the large repository of flat HTML, CSS, some JS and images.
It is a collection of TS files and references to an S3 bucket holding images.

The new website also contains an uopdated version of [trips viewer](https://github.com/UW-Macrostrat/rockd-trips) that shows maps for all trips.

## Installation for local development

1. Clone the repository
2. Create and populate a `.env` file with the appropriate environment variables (See [
   `.env.example`](https://github.com/UW-Macrostrat/web/blob/main/.env.example) for more information.)
3. Run `make` to pull down submodules and update packages
4. Verify that you have access to recent versions of Node.js and the Yarn package manager ( `node >= 16.0.0` and
   `yarn >= 4.0.0`; run `node -v` and `yarn -v` to check)
5. Run `yarn install` to update packages
6. Start the live-reloading development server with `yarn run dev`. The server will be available at
   `http://localhost:3000` by default.

ALTERNATIVLY

1. Clone the repository
2. Pull down submodules (`git submodule update --init --recursive`)
3. Create and populate a `.env` file with the appropriate environment variables (See [
   `.env.example`](https://github.com/UW-Macrostrat/web/blob/main/.env.example) for more information.)
4. Verify that you have access to recent versions of Node.js and the Yarn package manager ( `node >= 16.0.0` and
   `yarn >= 4.0.0`; run `node -v` and `yarn -v` to check)
5. Run `yarn install` to update packages
6. Start the live-reloading development server with `yarn run dev`. The server will be available at
   `http://localhost:3000` by default.
