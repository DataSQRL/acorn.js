# Custom query executor example

## Key Components of a Custom Query Executor

1. Implement the APIQueryExecutor Interface:

- The interface requires two main methods: validate and executeQuery
- You must also implement the enableValidation property

2. The Validation Method:

- Validates input arguments against the function definition schema
- Uses a JSON schema validator (like Ajv) to check if the args match the
  expected
  format
- Returns a ValidationResult to indicate success or failure

3. The Execute Method:

- Executes the actual GraphQL query against your API
- Handles API responses and errors
- Returns the result as a JSON string

## When to Create a Custom Executor

You might want to create a custom executor when:

1. You need to use a different HTTP client than the built-in fetch
2. You have custom authentication requirements
3. You want to add logging, monitoring, or metrics
4. You need to handle custom error handling and retries
5. You're creating mock implementations for testing
6. You want to integrate with specialized GraphQL clients (Apollo, URQL, etc.)

## Integrating Your Custom Executor

Once you've created your custom executor, you can integrate it with the library:

```typescript
// Create your custom executor
const customExecutor = new CustomApiQueryExecutor(
  "https://your-api.example.com/graphql",
  "your-api-key-here",
);

// Use it when converting your schema to functions
const functions = convertSchema(graphqlSchema, customExecutor);

// Or use it with a function factory
const functionFactory = new StandardAPIFunctionFactory(customExecutor);
const myFunction = functionFactory.create(functionDefinition, queryObject);
```
