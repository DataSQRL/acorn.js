import { describe, test } from "@jest/globals";
import { verifyExamplesExist } from "./test.utils";

describe("Examples Tests", () => {
  test("All example files should exist", () => {
    // Verify all example files exist in the repository
    verifyExamplesExist();
  });
});
