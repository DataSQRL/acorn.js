# Rick and morty API powered AI agent

This is `@datasqrl/acorn-node` package usage example with `langchain`.

It creates LangGraph and supplies it with tools automatically created from GraphQL API.

Basic setup of the agent can be found in [./rick-and-morty-agent.ts](./rick-and-morty-agent.ts).

_Please take a note `@langchain/core` and `zod` must be installed in your project to use `@datasqrl/acorn-node/langchain`_

## To run an example script

1. Install dependencies

```sh
npm ci
```

2. Run example script

```sh
export OPENAI_API_KEY=sk-...
npm run start
```

or...

3. Run interactive chat in your terminal

```sh
export OPENAI_API_KEY=sk-...
npm run start:interactive
```
