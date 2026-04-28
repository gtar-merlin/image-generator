const mockProvider = require("./mockProvider");
const openaiProvider = require("./openaiProvider");
const anthropicProvider = require("./anthropicProvider");

function getProvider(providerName) {
  if (providerName === "openai") return openaiProvider;
  if (providerName === "anthropic") return anthropicProvider;
  return mockProvider;
}

module.exports = {
  getProvider
};
