# `@datasqrl/acorn` usage example with `oil-gas-automation`

This example contains "oil-gas-automation" API-powered AI agent implementation.

It waits to receive low flow rate events over subscription, queries and analyzes
data provided by the "oil-gas-automation" API, and takes necessary action (or
does not).

The basic setup of the "oil-gas-automation" API can be
found [there](https://github.com/DataSQRL/datasqrl-examples/tree/main/oil-gas-agent-automation).

## To start the project:

1. Install dependencies:

```sh
npm ci
```

2. Create `.env.local` using [`.env.example`](.env.example) as template

3. Run in development mode

```sh
npm run dev
```
