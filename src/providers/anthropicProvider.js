const fetch = require("node-fetch");

async function generateDiagram(_request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  // Stub for provider abstraction wiring in this initial slice.
  await fetch("https://api.anthropic.com", { method: "GET" });

  throw new Error("Anthropic provider is wired but generation call is not implemented yet");
}

module.exports = {
  generateDiagram
};
