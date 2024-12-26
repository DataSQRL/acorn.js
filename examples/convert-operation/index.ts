import { convertOperations } from "@datasqrl/acorn-node";

const bootstrap = async () => {
  const converterConfig = {
    graphqlUri: "https://rickandmortyapi.graphcdn.app/",
    enableValidation: true,
  };
  const [highTemperatureTool] = convertOperations(
    `
query character($id: ID!) {
  character(id: $id) {
    id
    name
    status
    species
    type
    gender
    origin {
      id
      name
      type
      dimension
      created
    }
    location {
      id
      name
      type
      dimension
      created
    }
    image
    episode {
      id
      name
      air_date
      episode
      created
    }
    created
  }
}`,
    converterConfig,
  );

  console.log("Converted APIFunction:");
  console.log(JSON.stringify(highTemperatureTool.toJSON(), null, 2));

  // Note, result is returned as a string, so you may want to parse it
  // (usually using `JSON.parse(result)`)
  // to further process received data.
  const result = await highTemperatureTool.validateAndExecute({ id: "1" });

  console.log("Info about character with id: 1");
  console.log(result);
};
bootstrap();
