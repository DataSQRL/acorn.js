import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import type { MessageParam } from "@anthropic-ai/sdk/resources/index.mjs";
import {
  printMessage,
  printToolUsage,
} from "../../../examples/anthropic-ai/print.utils";

describe("Anthropic AI Example Print Utilities", () => {
  // Save original console.log
  const originalConsoleLog = console.log;

  beforeEach(() => {
    // Mock console.log for testing
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore original console.log
    console.log = originalConsoleLog;
  });

  test("printMessage handles string content correctly", () => {
    const message: MessageParam = {
      role: "user",
      content: "Hello, AI!",
    };

    printMessage(message);

    expect(console.log).toHaveBeenCalledWith("user: Hello, AI!");
  });

  test("printMessage handles array content correctly", () => {
    const message: MessageParam = {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "Hello, human!",
        },
        {
          type: "text",
          text: "How can I help you today?",
        },
      ],
    };

    printMessage(message);

    expect(console.log).toHaveBeenCalledWith(
      "assistant: Hello, human!\nHow can I help you today?",
    );
  });

  test("printMessage filters out non-text blocks", () => {
    const message: MessageParam = {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "I'll help you with that.",
        },
        {
          type: "tool_use",
          id: "tool-1",
          name: "character",
          input: { id: "1" },
        },
      ],
    };

    printMessage(message);

    expect(console.log).toHaveBeenCalledWith(
      "assistant: I'll help you with that.",
    );
  });

  test("printToolUsage does nothing for string content", () => {
    const message: MessageParam = {
      role: "user",
      content: "Hello, AI!",
    };

    printToolUsage(message);

    expect(console.log).not.toHaveBeenCalled();
  });

  test("printToolUsage does nothing for content array without tool_use blocks", () => {
    const message: MessageParam = {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "I'll help you with that.",
        },
      ],
    };

    printToolUsage(message);

    expect(console.log).not.toHaveBeenCalled();
  });

  test("printToolUsage logs tool use blocks", () => {
    const message: MessageParam = {
      role: "assistant",
      content: [
        {
          type: "text",
          text: "I'll help you with that.",
        },
        {
          type: "tool_use",
          id: "tool-1",
          name: "character",
          input: { id: "1" },
        },
        {
          type: "tool_use",
          id: "tool-2",
          name: "location",
          input: { id: "20" },
        },
      ],
    };

    printToolUsage(message);

    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      `Calling function "character" with arguments ${JSON.stringify({ id: "1" })}`,
    );
    expect(console.log).toHaveBeenCalledWith(
      `Calling function "location" with arguments ${JSON.stringify({ id: "20" })}`,
    );
  });
});
