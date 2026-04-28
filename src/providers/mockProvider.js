function buildTriangleSpec(prompt) {
  return {
    specVersion: 1,
    title: prompt,
    width: 900,
    height: 550,
    background: "#ffffff",
    primitives: [
      { type: "polygon", points: "120,430 120,130 520,430", fill: "none", stroke: "#0f172a", strokeWidth: 3 },
      { type: "line", x1: 120, y1: 430, x2: 520, y2: 430, stroke: "#2563eb", strokeWidth: 3 },
      { type: "line", x1: 120, y1: 430, x2: 120, y2: 130, stroke: "#16a34a", strokeWidth: 3 },
      { type: "line", x1: 120, y1: 130, x2: 520, y2: 430, stroke: "#dc2626", strokeWidth: 3 },
      { type: "text", x: 285, y: 460, text: "a", fontSize: 20, fill: "#2563eb", anchor: "middle" },
      { type: "text", x: 95, y: 285, text: "b", fontSize: 20, fill: "#16a34a", anchor: "middle" },
      { type: "text", x: 340, y: 265, text: "c", fontSize: 20, fill: "#dc2626", anchor: "middle" },
      { type: "text", x: 560, y: 120, text: "a^2 + b^2 = c^2", fontSize: 28, fill: "#111827" },
      { type: "text", x: 560, y: 160, text: "Prompt: " + prompt.slice(0, 60), fontSize: 14, fill: "#334155" }
    ]
  };
}

async function generateDiagram(request) {
  const prompt = request.prompt || "Triangle demonstrating Pythagorean theorem";
  return {
    refinedPrompt: "Create a clean geometry diagram from: " + prompt,
    spec: buildTriangleSpec(prompt),
    rawResponse: { provider: "mock", status: "ok" },
    model: "mock-v1",
    usage: { promptTokens: 0, completionTokens: 0 }
  };
}

module.exports = {
  generateDiagram
};
