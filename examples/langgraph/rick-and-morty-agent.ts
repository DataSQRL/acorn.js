import { GraphQLSchemaConverter } from "@datasqrl/acorn-node";
import { toLangChainTools } from "@datasqrl/acorn-node/langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

export type RickAndMortyAgent =
  ReturnType<typeof rickAndMortyAgent.create> extends Promise<infer T>
    ? T
    : never;

const createRickAndMortyAgent = async () => {
  // See https://rickandmortyapi.com for more info
  const API_URI = "https://rickandmortyapi.graphcdn.app/";

  // Step 1. Create Tools from API
  const jsonTools = await GraphQLSchemaConverter.createToolsFromApiUri(API_URI);

  // Step 2. Create agent
  const agent = createReactAgent({
    llm: new ChatOpenAI({
      model: "gpt-4o",
    }),
    checkpointSaver: new MemorySaver(),
    tools: toLangChainTools(jsonTools),
  });

  return agent;
};

const rickAndMortyAgent = {
  create: createRickAndMortyAgent,
};

export default rickAndMortyAgent;
