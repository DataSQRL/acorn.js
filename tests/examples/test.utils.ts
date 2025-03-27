import * as path from "path";
import * as fs from "fs";
import { expect } from "@jest/globals";

/**
 * Check if all example files exist in the repository
 */
export const verifyExamplesExist = () => {
  const examplesDir = path.resolve(__dirname, "../../examples");

  // Anthropic AI
  expect(fs.existsSync(path.join(examplesDir, "anthropic-ai/index.ts"))).toBe(
    true,
  );
  expect(
    fs.existsSync(path.join(examplesDir, "anthropic-ai/print.utils.ts")),
  ).toBe(true);

  // Chat Persistence
  expect(
    fs.existsSync(path.join(examplesDir, "chat-persistence/index.ts")),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(examplesDir, "chat-persistence/langchain.ts")),
  ).toBe(true);

  // Convert Operation
  expect(
    fs.existsSync(path.join(examplesDir, "convert-operation/index.ts")),
  ).toBe(true);

  // Custom Query Executor
  expect(
    fs.existsSync(path.join(examplesDir, "custom-query-executor/index.ts")),
  ).toBe(true);
  expect(
    fs.existsSync(
      path.join(examplesDir, "custom-query-executor/CustomApiQueryExecutor.ts"),
    ),
  ).toBe(true);

  // LangChain
  expect(fs.existsSync(path.join(examplesDir, "langchain/index.ts"))).toBe(
    true,
  );
  expect(
    fs.existsSync(path.join(examplesDir, "langchain/rick-and-morty-agent.ts")),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(examplesDir, "langchain/interactive.ts")),
  ).toBe(true);

  // Oil Gas Automation
  expect(
    fs.existsSync(path.join(examplesDir, "oil-gas-automation/index.html")),
  ).toBe(true);
  expect(
    fs.existsSync(path.join(examplesDir, "oil-gas-automation/src/main.tsx")),
  ).toBe(true);

  // OpenAI
  expect(fs.existsSync(path.join(examplesDir, "openai/index.ts"))).toBe(true);
  expect(fs.existsSync(path.join(examplesDir, "openai/print.utils.ts"))).toBe(
    true,
  );
};

/**
 * Check if a file contains expected patterns, handling multiline content
 */
export const checkFileContent = (
  relativePath: string,
  expectedPatterns: string[],
) => {
  const filePath = path.resolve(__dirname, "../../examples", relativePath);

  // Make sure the file exists
  expect(fs.existsSync(filePath)).toBe(true);

  // Read file content and normalize line breaks
  const content = fs.readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");

  for (const pattern of expectedPatterns) {
    // Handle potential multiline patterns by normalizing them too
    const normalizedPattern = pattern.replace(/\r\n/g, "\n");

    // For multiline imports, we need to handle whitespace variations
    const isImport =
      normalizedPattern.includes("import") &&
      normalizedPattern.includes("from");

    if (isImport) {
      // For imports, check more flexibly by removing whitespace
      const strippedContent = content.replace(/\s+/g, " ");
      const strippedPattern = normalizedPattern.replace(/\s+/g, " ");
      expect(strippedContent).toContain(strippedPattern);
    } else {
      expect(content).toContain(normalizedPattern);
    }
  }
};

/**
 * Check for import presence by module name and imported object
 */
export const checkImports = (
  relativePath: string,
  moduleImports: {
    module: string;
    imports: string[];
  }[],
) => {
  const filePath = path.resolve(__dirname, "../../examples", relativePath);

  // Make sure the file exists
  expect(fs.existsSync(filePath)).toBe(true);

  // Read file content and normalize line breaks
  const content = fs.readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");

  // Very basic AST-like parsing of imports
  // This regex will find lines with import statements, including multiline ones
  const importRegex =
    /import\s+(?:{[\s\n]*([^}]*)[\s\n]*}|\*\s+as\s+([^from]*)|([^{}\s]+))\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  // Store found imports for verification
  const foundImports = new Map<string, Set<string>>();

  while ((match = importRegex.exec(content)) !== null) {
    // Group 4 is always the module name
    const moduleName = match[4];

    // Initialize the set for this module if it doesn't exist
    if (!foundImports.has(moduleName)) {
      foundImports.set(moduleName, new Set<string>());
    }

    // Handle different import formats:
    if (match[1]) {
      // Named imports: import { a, b } from 'module'
      const namedImports = match[1]
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i.length > 0);

      for (const namedImport of namedImports) {
        // Handle 'as' aliases: import { a as b } from 'module'
        const importName = namedImport.split(/\s+as\s+/)[0].trim();
        foundImports.get(moduleName)!.add(importName);
      }
    } else if (match[2]) {
      // Namespace imports: import * as ns from 'module'
      foundImports.get(moduleName)!.add(match[2].trim());
    } else if (match[3]) {
      // Default imports: import def from 'module'
      foundImports.get(moduleName)!.add(match[3].trim());
    }
  }

  // Verify that all expected imports exist
  for (const { module, imports } of moduleImports) {
    // First check the module is imported
    expect(
      Array.from(foundImports.keys()).some((m) => m.includes(module)),
    ).toBe(true);

    // Then check each expected import
    for (const importItem of imports) {
      const moduleFound = Array.from(foundImports.entries()).find(([m]) =>
        m.includes(module),
      );

      if (moduleFound) {
        // If we care about specific imports, check them
        if (importItem !== "*") {
          expect(
            moduleFound[1].has(importItem) ||
              Array.from(moduleFound[1]).some((i) => i.includes(importItem)),
          ).toBe(true);
        }
      }
    }
  }
};

/**
 * Check if a package.json has the right dependencies
 */
export const checkPackageJson = (
  relativePath: string,
  expectedDependencies: string[],
) => {
  const filePath = path.resolve(
    __dirname,
    "../../examples",
    relativePath,
    "package.json",
  );

  // Make sure the file exists
  expect(fs.existsSync(filePath)).toBe(true);

  const packageJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Check if all expected dependencies are present
  for (const dep of expectedDependencies) {
    expect(Object.keys(packageJson.dependencies || {})).toContain(dep);
  }
};
