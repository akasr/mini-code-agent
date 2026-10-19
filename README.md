# MiniCode Agent

MiniCode Agent is a small command-line coding assistant powered by Google Gemini. Give it a task in plain language and it can inspect the current project and run its test suite using a limited set of built-in tools.

## Requirements

- Node.js
- pnpm 12.14.0 (the project declares this version through Corepack)
- A Google Gemini API key

## Setup

Install dependencies and configure your API key in a `.env` file at the project root:

```sh
pnpm install
```

```dotenv
GEMINI_API_KEY=your-gemini-api-key
# Optional; defaults to gemini-3.6-flash
GEMINI_MODEL=gemini-3.6-flash
```

`GEMINI_MODEL` is optional. If omitted, the agent uses `gemini-3.6-flash`.

## Usage

Run a task from the project directory:

```sh
pnpm dev "Inspect the project and run its tests"
```

The agent prints tool activity as it works, followed by its final response. If no task is provided, the CLI prints a usage message.

## Available tools

- `list_files`: list entries in a project directory; ignores `.git`, `node_modules`, and `dist`.
- `read_file`: read a UTF-8 file in the project, up to 200 KB.
- `run_tests`: run the predefined `pnpm test` command, with a 30-second timeout.

File operations are scoped to the directory where the CLI is started. The agent cannot use these tools to write files, delete files, or run arbitrary shell commands. Model requests are limited to five turns per run.

## Development

```sh
pnpm test       # Run the Vitest suite
pnpm typecheck  # Check TypeScript types
pnpm dev "..."  # Run the agent with a task
```
## Planned Features

- **explain**: Explain a specified file or function using its actual source code.
- **debug**: Run tests, inspect failures, and identify likely causes.
- **review**: Analyze code for potential bugs and maintainability issues.


> MiniCode Agent is a work in progress. Phase 1 establishes the agent and its tools; Phase 2 adds practical developer workflows.