# TypeScript Implementation of Acorn Agent

This is the TypeScript implementation of Acorn Agent which provides the
libraries you need to implement an AI agent.

## Getting Started

Install package

```
npm i @datasqrl/acorn
```

You can use both `require` and `import` syntax

```typescript
const { createToolsFromApiUri } = require("@datasqrl/acorn");
// or
import { createToolsFromApiUri } from "@datasqrl/acorn";
```

To create a converter follow the example below

```typescript
import { convertSchema } from "@datasqrl/acorn";
// load your graphQL schema from somewhere
const graphQlSchemaString = "...";
// You need to implement `APIQueryExecutor` interface to query and validate APIQuery
// Or use existing `FetchApiQueryExecutor` provided by package
const apiExecutor = new MyApiQueryExecutor();

// your functions are here
const functions = convertSchema(graphQlSchemaString, apiExecutor);
```

## Use cases

- [Integration with `@langchain/langgraph`](./examples/langchain)

- [Integration with `openai` package](./examples/openai)

- [Integration with `@anthropic-ai/sdk` package](./examples/anthropic-ai)

- [Convert single GraphQL operation to a tool](./examples/convert-operation)

- [Store chat history using your API](./examples/chat-persistence/)
