import { generateText } from "./llm.js";

async function main(): Promise<void> {
    const prompt = process.argv.slice(2).join(" ").trim();

    if (!prompt) {
        console.error('Usage: pnpm dev "Explain how Node.js handles I/O');
        process.exitCode = 1;
        return;
    }

    try {
        const answer = await generateText(prompt);
        console.log("\nMiniCode Agent\n");
        console.log(answer);
    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? error.message
                : "An unexpected error occurred.";

        console.error("Request failed: ", message);
        process.exitCode = 1;
    }
}

main();