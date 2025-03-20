import OpenAI from "openai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { APIFunction, ApiQuery, createToolsFromApiUri } from "@datasqrl/acorn";
import { gql, useSubscription } from "@apollo/client";

export const ACTION_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "Action",
    description: "Takes necessary action",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["shut_off", "hot_wax_treatment", "full_inspection", "ignore"],
          description: "Type of action to take",
        },
        description: {
          type: "string",
          description: "Explanation of why this action should be taken",
        },
      },
      required: ["type", "description"],
      additionalProperties: false,
    },
    strict: true,
  },
};

export const getPrompt = (data: { LowFlowRate: { assetId: number } }) => `
  You are a diagnostic agent for oil wells operated in various fields. Given an abnormal sensor reading from a well for asset ID ${data.LowFlowRate.assetId}, you analyze available data retrieved via tools to diagnose the issue as follows:
  First, check at least ten recent pressure readings. If pressure dispersion is less than 10psi, consider this an outlier, and take the action to ignore. If pressure dispersion is more than 100psi, immediately take the action to shut off the well. If pressure dispersion is more than 10psi but less than 100psi, check the maintenance records if the well had a hot wax treatment (wo_type is PIPE_CLEANING) in the last 10 months. If not, order one, and if it had one, you order a full inspection.
  The current time is ${new Date()}.
  You retrieve all data via tool calls. You take action by calling a tool. You always respond with a tool call.
`;

export const useConstants = () => {
  const openAI = useMemo(
    () =>
      new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      }),
    [],
  );

  const [apiTools, setApiTools] = useState<APIFunction<ApiQuery>[]>();

  useEffect(() => {
    let active = true;

    void load();

    return () => {
      active = false;
    };

    async function load() {
      const result = await createToolsFromApiUri({
        graphqlUri: import.meta.env.VITE_API_URL,
        enableValidation: true,
      });

      if (!active) {
        return;
      }

      setApiTools(result);
    }
  }, []);

  const { data } = useSubscription(gql`
    subscription {
      LowFlowRate {
        assetId
        flowrate
        asset_number
        asset_name
        description
      }
    }
  `);

  const [log, setLog] = useState("Monitoring...");

  const appendLog = useCallback((value: string) => {
    setLog((previousLog) => `${previousLog}\n\n${value}`);
  }, []);

  const logEventArrived = useCallback(() => {
    setLog("Monitoring...\n\nEvent arrived...");
  }, []);

  const logToolCalls = useCallback(
    (
      toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[],
      toolCallResults: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[],
    ) => {
      toolCalls.forEach((toolCall) => {
        let output = `'${toolCall.function.name}' function was called with such payload:\n${JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}`;
        const toolCallResult = toolCallResults.find(
          ({ tool_call_id }) => tool_call_id === toolCall.id,
        );

        if (
          toolCallResult?.content &&
          typeof toolCallResult.content === "string"
        ) {
          output += `\nGot such response:\n${JSON.stringify(JSON.parse(toolCallResult.content), null, 2)}`;
        }

        appendLog(output);
      });
    },
    [appendLog],
  );

  return { openAI, apiTools, data, log, logEventArrived, logToolCalls };
};
