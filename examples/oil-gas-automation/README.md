# `@datasqrl/acorn` usage example with `oil-gas-automation`

This example contains "oil-gas-automation" API-powered AI agent implementation.

It waits to receive low flow rate events over subscription, queries and analyzes
data provided by the "oil-gas-automation" API, and takes necessary action (or
does not).

## To start the project:

1. Install dependencies:

```sh
npm ci
```

2. Create `.env.local` using [`.env.example`](.env.example) as template

3. Run the data backend:

```shell
 docker run -it -p 8888:8888 -p 8081:8081 -p 9092:9092 --rm -e TZ=“UTC” datasqrl/examples:oil-gas run -c package-local.json
```

4. Run the example in development mode

```sh
npm run dev
```
