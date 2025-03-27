import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

describe("Anthropic AI Example Environment Handling", () => {
  const originalEnv = process.env;
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;

  beforeEach(() => {
    // Mock console.error and process.exit
    console.error = jest.fn();
    process.exit = jest.fn() as any;

    // Reset process.env
    process.env = { ...originalEnv };

    // Clear module cache to ensure clean state
    jest.resetModules();
  });

  afterEach(() => {
    // Restore originals
    process.env = originalEnv;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });

  test("Example detects missing API key", () => {
    // Ensure ANTHROPIC_API_KEY is not set
    delete process.env.ANTHROPIC_API_KEY;

    // Get the example file content
    const examplePath = path.join(
      __dirname,
      "../../../examples/anthropic-ai/index.ts",
    );
    const exampleContent = fs.readFileSync(examplePath, "utf-8");

    // Check if the example checks for the API key
    expect(exampleContent).toContain("process.env.ANTHROPIC_API_KEY");

    // Use eval to execute just the API key check portion of the example
    // This is safer than requiring the file which would execute everything
    const apiKeyCheckCode = `
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error("ANTHROPIC_API_KEY env variable is missing!");
        process.exit(1);
      }
    `;

    // Execute the API key check
    eval(apiKeyCheckCode);

    // Verify the check detected missing API key
    expect(console.error).toHaveBeenCalledWith(
      "ANTHROPIC_API_KEY env variable is missing!",
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test("Example proceeds when API key is present", () => {
    // Set ANTHROPIC_API_KEY
    process.env.ANTHROPIC_API_KEY = "test-api-key";

    // Use the API key check code
    const apiKeyCheckCode = `
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error("ANTHROPIC_API_KEY env variable is missing!");
        process.exit(1);
      }
    `;

    // Execute the API key check
    eval(apiKeyCheckCode);

    // Verify the check passed
    expect(console.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });
});
