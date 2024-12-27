# `ChatPersistence` usage example.

Chat persistence allows you to store chat history between sessions and additionally process it on a backend.

This example shows how you can setup chat persistence for different AI agents.

## To run an example script

Example script uses [DataSQRL](https://www.datasqrl.com/) API to persist data

1. Run Sensors API in Docker

   1.1. Compile API

   ```sh
   (cd api; docker run -it --rm -v $PWD:/build datasqrl/cmd compile)
   ```

   1.2. Next, you run the data pipeline with docker compose

   ```sh
   (cd api/build/deploy; docker compose up --build)
   ```

   1.3. To check that the GraphQL API is running properly, open GraphiQL (http://localhost:8888/graphiql/) to access the API.

2. Install dependencies for this example

```sh
npm ci
```

3. Now you have 2 options to run. In any case you may want to run script a couple times to see the message history is persisted between runs.

   3.1. An example that uses `chatPersistence.fromTools` function and `openai` library as LLM provider. This example persist message history using tools generated from GraphQL API.

   Execute the following code to run this example:

   ```sh
   export OPENAI_API_KEY=sk-...
   npm run start
   ```

   3.2. An example that uses `PersistentSaver` class implemented seamless integration with `@langchain/langgraph`. This example shows how you can manually define GraphQL query and mutation that will be used to persist message history.

   _Note the `persistenceFormatters` used in this example. They are responsible for mapping Langchain message classes to DTOs acceptable to your API, and vice versa_

   Execute the following code to run this example:

   ```sh
   export OPENAI_API_KEY=sk-...
   npm run langchain
   ```
