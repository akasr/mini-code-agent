
import { runAgent } from "./llm.js";

async function main(): Promise<void> {
  const task = process.argv.slice(2).join(" ").trim();

  if (!task) {
    console.error(
      'Usage: pnpm dev "Inspect the project and run its tests"',
    );
    process.exitCode = 1;
    return;
  }

  try {
    console.log("\nMiniCode Agent\n");

    const answer = await runAgent(task);

    console.log("\nFinal answer:\n");
    console.log(answer);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

    console.error("\nAgent failed:", message);
    process.exitCode = 1;
  }
}

main();
