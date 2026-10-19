import { spawn } from "node:child_process";
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = await realpath(process.cwd());
const TEST_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_LENGTH = 12_000;

type ToolInput = Record<string, unknown>;

type ToolDefinition = {
    description: string;
    execute: (input: ToolInput) => Promise<string>;
};

function getString(
    input: ToolInput,
    key: string,
    defaultValue?: string,
): string {
    const value = input[key];

    if (value === undefined && defaultValue !== undefined) {
        return defaultValue;
    }

    if (typeof value !== "string") {
        throw new Error(`"${key}" must be a string.`);
    }

    return value;
}

async function resolveProjectPath(relativePath: string): Promise<string> {
    const candidate = path.resolve(PROJECT_ROOT, relativePath);
    const relative = path.relative(PROJECT_ROOT, candidate);

    if (
        relative === ".." ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
    ) {
        throw new Error("Path is outside the project directory.");
    }

    const actualPath = await realpath(candidate);
    const actualRelative = path.relative(PROJECT_ROOT, actualPath);

    if (
        actualRelative === ".." ||
        actualRelative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(actualRelative)
    ) {
        throw new Error("Path resolves outside the project directory.");
    }

    return actualPath;
}

async function listFiles(input: ToolInput): Promise<string> {
    const relativePath = getString(input, "path", ".");
    const directory = await resolveProjectPath(relativePath);
    const details = await stat(directory);

    if (!details.isDirectory()) {
        throw new Error("The requested path is not a directory.");
    }

    const entries = await readdir(directory, {
        withFileTypes: true,
    });

    const ignored = new Set([".git", "node_modules", "dist"]);

    return (
        entries
            .filter((entry) => !ignored.has(entry.name))
            .map(
                (entry) =>
                    `${entry.isDirectory() ? "[DIR] " : "[FILE] "}${entry.name}`,
            )
            .join("\n") || "(Directory is empty)"
    );
}

async function readProjectFile(input: ToolInput): Promise<string> {
    const relativePath = getString(input, "path");
    const filePath = await resolveProjectPath(relativePath);
    const details = await stat(filePath);

    if (!details.isFile()) {
        throw new Error("The requested path is not a file.");
    }

    // Avoid accidentally loading huge files into the model context.
    if (details.size > 200_000) {
        throw new Error("File exceeds the 200 KB read limit.");
    }

    return readFile(filePath, "utf8");
}

async function runTests(): Promise<string> {
    return new Promise((resolve, reject) => {
        // The model cannot choose the executable or its arguments.
        const child = spawn("pnpm", ["test"], {
            cwd: PROJECT_ROOT,
            shell: false,
            stdio: ["ignore", "pipe", "pipe"],
        });

        let output = "";
        let settled = false;

        const appendOutput = (chunk: Buffer) => {
            output += chunk.toString();

            if (output.length > MAX_OUTPUT_LENGTH) {
                output = output.slice(-MAX_OUTPUT_LENGTH);
            }
        };

        child.stdout.on("data", appendOutput);
        child.stderr.on("data", appendOutput);

        const timeout = setTimeout(() => {
            child.kill();
            finish(
                new Error(
                    `Tests exceeded the ${TEST_TIMEOUT_MS / 1000}-second timeout.`,
                ),
            );
        }, TEST_TIMEOUT_MS);

        const finish = (error?: Error, result?: string) => {
            if (settled) return;

            settled = true;
            clearTimeout(timeout);

            if (error) {
                reject(error);
            } else {
                resolve(result ?? "");
            }
        };

        child.on("error", (error) => finish(error));

        child.on("close", (code) => {
            finish(
                undefined,
                `Exit code: ${code}\n\n${output || "(No output)"}`,
            );
        });
    });
}

export const tools: Record<string, ToolDefinition> = {
    list_files: {
        description:
            'List project files. Input: { "path": "src" } (path is optional; defaults to ".").',
        execute: listFiles,
    },

    read_file: {
        description:
            'Read a UTF-8 project file. Input: { "path": "src/cli.ts" }.',
        execute: readProjectFile,
    },

    run_tests: {
        description: "Run the predefined pnpm test command. Input: {}.",
        execute: async () => runTests(),
    },
};

export async function executeTool(
    name: string,
    input: unknown,
): Promise<string> {
    const tool = tools[name];

    if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
    }

    if (input === null || typeof input !== "object" || Array.isArray(input)) {
        throw new Error("Tool input must be an object.");
    }

    return tool.execute(input as ToolInput);
}
