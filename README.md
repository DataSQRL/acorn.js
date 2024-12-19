# TypeScript Implementation of Acorn Agent

This is the TypeScript implementation of Acorn Agent which provides the libraries you need to implement an AI agent.

## Getting Started

Install package and dependency

```
npm i @datasqrl/acorn-node
```

You can use both `require` and `import` syntax

```typescript
const { GraphQLSchemaConverter } = require("@datasqrl/acorn-node");
// or
import { GraphQLSchemaConverter } from "@datasqrl/acorn-node";
```

To create a converter follow the example below

```typescript
// load your graphQL schema from somewhere
const graphQlSchemaString = "...";
// You need to implement `APIQueryExecutor` interface to query and validate APIQuery
const apiExecutor = new MyApiQueryExecutor();

const converter = new GraphQLSchemaConverter(
  graphQlSchemaString,
  new StandardAPIFunctionFactory(apiExecutor),
);

// your functions are here
const functions = converter.convertSchema();
```
