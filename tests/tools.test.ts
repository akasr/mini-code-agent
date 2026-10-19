
import { describe, expect, it } from "vitest";
import { executeTool } from "../src/tools.js";

describe("tool registry", () => {
  it("lists files in the project", async () => {
    const result = await executeTool("list_files", {});

    expect(result).toContain("package.json");
  });

  it("reads a project file", async () => {
    const result = await executeTool("read_file", {
      path: "package.json",
    });

    expect(result).toContain('"name"');
  });

  it("rejects paths outside the project", async () => {
    await expect(
      executeTool("read_file", {
        path: "../../etc/passwd",
      }),
    ).rejects.toThrow("outside the project directory");
  });

  it("rejects unknown tools", async () => {
    await expect(
      executeTool("delete_everything", {}),
    ).rejects.toThrow("Unknown tool");
  });
});
