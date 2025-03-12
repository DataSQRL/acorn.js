import {
  convertSchema,
  StandardAPIFunctionFactory,
} from "@datasqrl/acorn-node";
import {
  toOpenAiTools,
  createOpenAiToolResults,
} from "@datasqrl/acorn-node/openai";
import { OpenAI } from "openai";
import { CustomApiQueryExecutor } from "./CustomApiQueryExecutor";

// Example showing how to use a custom executor with OpenAI
async function main() {
  // 1. Load your GraphQL schema
  const graphqlSchema = `
    type Query {
      getProduct(id: ID!): Product
      searchProducts(query: String!, limit: Int): [Product]
    }

    type Product {
      id: ID!
      name: String!
      price: Float!
      description: String
      inStock: Boolean!
    }
  `;

  // 2. Create your custom executor
  const customExecutor = new CustomApiQueryExecutor(
    "https://your-api.example.com/graphql",
    "your-api-key-here",
    { enableValidation: true },
  );

  // 3. Convert your schema to functions using the custom executor
  const functionFactory = new StandardAPIFunctionFactory(customExecutor);

  // There are two ways to create tools:

  // Option 1: Using the factory directly with convertSchema
  const functions = convertSchema(graphqlSchema, customExecutor);

  // Option 2: For more control over each function
  // Create functions manually from your schema
  // const queryType = buildSchema(graphqlSchema).getQueryType();
  // const functions = Object.values(queryType?.getFields() || {}).map(field => {
  //   const functionDef = createFunctionDefinition(field.name, field.description?.trim());
  //   // Build query for this function...
  //   const query = { query: `query ${field.name}(...) {...}` };
  //   return functionFactory.create(functionDef, query);
  // });

  // 4. Convert to OpenAI format
  const openAITools = toOpenAiTools(functions);

  // 5. Use with OpenAI
  const openai = new OpenAI();
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "user", content: "Find me products related to running shoes" },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools: openAITools,
  });

  console.log("AI response:", response.choices[0].message);

  // 6. Process any function calls
  if (response.choices[0].message.tool_calls?.length) {
    const functionCallResults = await createOpenAiToolResults(
      response.choices[0].message,
      functions,
    );

    // Add function results to messages
    messages.push(response.choices[0].message);
    messages.push(...functionCallResults);

    // Get final response
    const finalResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    console.log("Final response:", finalResponse.choices[0].message.content);
  }
}

main().catch(console.error);
