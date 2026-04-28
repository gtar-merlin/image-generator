const { getProvider } = require("../providers");
const { validateDiagramSpec } = require("./validator");
const { renderSpecToSvg } = require("./svgRenderer");
const storage = require("../db/storage");

function buildCompiledJs(spec) {
  return [
    "// Generated from DiagramSpec",
    "const diagramSpec = " + JSON.stringify(spec, null, 2) + ";",
    "// Compile into renderer runtime in future phase"
  ].join("\n");
}

async function generateDiagram(input) {
  const providerName = input.provider || process.env.LLM_PROVIDER || "mock";
  const request = storage.createRequest({
    prompt: input.prompt,
    settings: input.settings || {}
  });
  storage.updateRequestStatus(request.id, "generating");

  try {
    const provider = getProvider(providerName);
    const providerResult = await provider.generateDiagram({
      prompt: input.prompt,
      settings: input.settings || {}
    });

    const validation = validateDiagramSpec(providerResult.spec);
    if (!validation.isValid) {
      storage.updateRequestStatus(request.id, "failed");
      storage.createGeneration({
        requestId: request.id,
        provider: providerName,
        model: providerResult.model || "unknown",
        refinedPrompt: providerResult.refinedPrompt || "",
        diagramSpec: providerResult.spec,
        compiledJs: "",
        validationResult: validation,
        rawProviderResponse: providerResult.rawResponse || {},
        status: "failed"
      });
      return {
        requestId: request.id,
        status: "failed",
        errors: validation.errors
      };
    }

    storage.updateRequestStatus(request.id, "rendering");
    const svg = renderSpecToSvg(providerResult.spec);
    const generation = storage.createGeneration({
      requestId: request.id,
      provider: providerName,
      model: providerResult.model || "unknown",
      refinedPrompt: providerResult.refinedPrompt || "",
      diagramSpec: providerResult.spec,
      compiledJs: buildCompiledJs(providerResult.spec),
      validationResult: validation,
      rawProviderResponse: providerResult.rawResponse || {},
      status: "succeeded"
    });
    storage.createArtifact({
      generationId: generation.id,
      type: "preview",
      format: "svg",
      content: svg
    });
    storage.updateRequestStatus(request.id, "ready");

    return {
      requestId: request.id,
      status: "ready",
      provider: providerName,
      model: generation.model,
      refinedPrompt: generation.refinedPrompt
    };
  } catch (err) {
    storage.updateRequestStatus(request.id, "failed");
    return {
      requestId: request.id,
      status: "failed",
      errors: [{ message: err.message }]
    };
  }
}

module.exports = {
  generateDiagram
};
