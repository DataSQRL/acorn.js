import { describe, test, expect } from "@jest/globals";

import { StandardAPIFunctionFactory } from "../../src/converter/standard-api-function-factory";
import { MockAPIExecutor } from "../mocks/mock-api-executor";
import { GraphQLSchemaConverter } from "../../src/converter/graphql-schema-converter";
import { TestUtil } from "../test.utils";
import { APIFunction } from "../../src/tool/api-function";
import { GraphQLSchemaConverterConfig } from "../../src/converter/graphql-schema-converter-config";

const apiExecutor = MockAPIExecutor.create("none");
const functionFactory = new StandardAPIFunctionFactory(apiExecutor, new Set());

function getConverter(schemaString: string): GraphQLSchemaConverter {
  return new GraphQLSchemaConverter(schemaString, functionFactory);
}

function getFunctionsFromPath(path: string): APIFunction[] {
  const schemaString = TestUtil.getAssetFileAsString(path);
  return getConverter(schemaString).convertSchema();
}

function snapshotFunctions(functions: APIFunction[], testName: string): void {
  TestUtil.snapshotTestOrCreate(
    JSON.stringify(functions, null, 2),
    `snapshot/${testName}.json`,
  );
}

describe("GraphQLSchemaConverter Tests", () => {
  test("testNutshop", () => {
    const converter = new GraphQLSchemaConverter(
      TestUtil.getAssetFileAsString("graphql/nutshop-schema.graphqls"),
      new StandardAPIFunctionFactory(apiExecutor, new Set(["customerid"])),
      new GraphQLSchemaConverterConfig(
        GraphQLSchemaConverterConfig.ignorePrefix("internal"),
      ),
    );

    const functions = converter.convertSchema();
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
    const converter = getConverter(
      TestUtil.getAssetFileAsString("graphql/sensors.graphqls"),
    );
    const functions = converter.convertSchema();
    expect(functions).toHaveLength(5);

    const queries = converter.convertOperations(
      TestUtil.getAssetFileAsString("graphql/sensors-aboveTemp.graphql"),
    );
    expect(queries).toHaveLength(2);
    expect(queries[0].function.name).toBe("HighTemps");

    functions.push(...queries);
    snapshotFunctions(functions, "sensors");
  });
});
