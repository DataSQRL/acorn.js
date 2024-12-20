import { describe, test, expect } from "@jest/globals";

import {
  StandardAPIFunctionFactory,
  GraphQLSchemaConverter,
  graphQlSchemaConverterConfig,
  GraphQlOperationConverter,
} from "../../../src/converter";
import { MockAPIExecutor } from "../../mocks/mock-api-executor";
import { TestUtil } from "../../test.utils";
import { APIFunction } from "../../../src/tool";
import { ApiQuery, FetchApiQueryExecutor } from "../../../src/api";

const apiExecutor = MockAPIExecutor.create("none");
const functionFactory = new StandardAPIFunctionFactory(apiExecutor, new Set());
const operationConverter = new GraphQlOperationConverter(functionFactory);

function getConverter(): GraphQLSchemaConverter {
  return new GraphQLSchemaConverter(functionFactory);
}

function getFunctionsFromPath(path: string) {
  const schemaString = TestUtil.getAssetFileAsString(path);
  return getConverter().convertSchema(schemaString);
}

function snapshotFunctions(
  functions: APIFunction<ApiQuery>[],
  testName: string,
): void {
  TestUtil.snapshotTestOrCreate(
    JSON.stringify(
      functions.map((f) => f.toJSON()),
      null,
      2,
    ),
    `snapshot/${testName}.json`,
  );
}

describe("GraphQLSchemaConverter Tests", () => {
  test("testNutshop", () => {
    const converter = new GraphQLSchemaConverter(
      new StandardAPIFunctionFactory(apiExecutor, new Set(["customerid"])),
      graphQlSchemaConverterConfig.create(
        graphQlSchemaConverterConfig.createIgnorePrefixOperationFilter(
          "internal",
        ),
      ),
    );
    const schemaString = TestUtil.getAssetFileAsString(
      "graphql/nutshop-schema.graphqls",
    );

    const functions = converter.convertSchema(schemaString);
    expect(functions).toHaveLength(5);

    const ordersFunction = functions.find(
      (f) => f.getName().toLowerCase() === "orders",
    );
    expect(ordersFunction).toBeDefined();
    expect(ordersFunction?.function.parameters.properties).toHaveProperty(
      "customerid",
    );
    expect(
      ordersFunction?.getModelFunction().parameters.properties,
    ).not.toHaveProperty("customerid");

    snapshotFunctions(functions, "nutshop");
  });

  test("testCreditCard", () => {
    const functions = getFunctionsFromPath(
      "graphql/creditcard-rewards.graphqls",
    );
    expect(functions).toHaveLength(6);
    snapshotFunctions(functions, "creditcard-rewards");
  });

  test("testLawEnforcement", () => {
    const functions = getFunctionsFromPath("graphql/law_enforcement.graphqls");
    expect(functions).toHaveLength(7);
    snapshotFunctions(functions, "law_enforcement");
  });

  test("testSensors", () => {
    const converter = getConverter();
    const schemaString = TestUtil.getAssetFileAsString(
      "graphql/sensors.graphqls",
    );
    const functions = converter.convertSchema(schemaString);
    expect(functions).toHaveLength(5);

    const queries = operationConverter.convertOperations(
      TestUtil.getAssetFileAsString("graphql/sensors-aboveTemp.graphql"),
    );
    expect(queries).toHaveLength(2);
    expect(queries[0].function.name).toBe("HighTemps");

    snapshotFunctions([...functions, ...queries], "sensors");
  });

  test("Rick and Morty", async () => {
    const expectedCharactersGraphQLQuery =
      "query characters($page: Int, $name: String, $status: String, $species: String, $type: String, $gender: String) {\ncharacters(page: $page, filter: { name: $name, status: $status, species: $species, type: $type, gender: $gender }) {\ninfo {\ncount\npages\nnext\nprev\n}\nresults {\nid\nname\nstatus\nspecies\ntype\ngender\norigin {\nid\nname\ntype\ndimension\ncreated\n}\nlocation {\nid\nname\ntype\ndimension\ncreated\n}\nimage\nepisode {\nid\nname\nair_date\nepisode\ncreated\n}\ncreated\n}\n}\n\n}";

    const fetchApiExecutor = new FetchApiQueryExecutor(
      "https://rickandmortyapi.graphcdn.app/",
    );
    const converter = new GraphQLSchemaConverter(
      new StandardAPIFunctionFactory(fetchApiExecutor),
    );
    const functions = await converter.convertSchemaFromUri();
    expect(functions).toHaveLength(9);

    const charactersListFunction = functions.find(
      (def) => def.function.name === "characters",
    );
    expect(charactersListFunction).toBeTruthy();
    expect(charactersListFunction?.apiQuery.query).toBe(
      expectedCharactersGraphQLQuery,
    );
  });
});
