import { describe, expect, test } from "@jest/globals";
import { toLangChainTools } from "../../src/langchain";
import { TestUtil } from "../test.utils";
import { APIFunction } from "../../src";
import { z } from "zod";

describe("toLangChainTools", () => {
  test("returns valid zod schema", () => {
    const functions = JSON.parse(
      TestUtil.getAssetFileAsString("snapshot/sensors.json"),
    ) as APIFunction[];
    const functionToTest = functions[1];
    expect(functionToTest.function.name).toBe("ReadingsAboveTemp");

    const tools = toLangChainTools(functionToTest);

    expect(tools.schema.shape.temp).toBeInstanceOf(z.ZodNumber);
    expect(tools.schema.shape.temp.isOptional()).toBeFalsy();
    expect(tools.schema.shape.temp.isInt).toBeFalsy();

    expect(tools.schema.shape.limit).toBeInstanceOf(z.ZodOptional);
    expect(tools.schema.shape.limit._def.innerType).toBeInstanceOf(z.ZodNumber);
    expect(tools.schema.shape.limit.isOptional()).toBeTruthy();
    expect(tools.schema.shape.limit._def.innerType.isInt).toBeTruthy();
  });
});
