const fetch = require("node-fetch");

function extractTextFromResponse(json) {
  if (!json || !Array.isArray(json.choices) || !json.choices.length) return "";
  var msg = json.choices[0].message || {};
  var content = msg.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map(function(part) {
        return part && part.type === "text" ? part.text : "";
      })
      .join("\n");
  }
  return "";
}

function parseJsonFromText(text) {
  if (!text) return null;

  var trimmed = text.trim();
  if (trimmed[0] === "{") {
    return JSON.parse(trimmed);
  }

  var fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return JSON.parse(fenced[1].trim());
  }

  var start = trimmed.indexOf("{");
  var end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1));
  }

  return null;
}

function buildSystemPrompt() {
  return [
    "You generate a JSON DiagramSpec for a deterministic SVG renderer.",
    "Return ONLY valid JSON (no markdown).",
    "Schema requirements:",
    "- specVersion: 1",
    "- width: integer 200..1600",
    "- height: integer 200..1200",
    "- background: string hex color",
    "- title: short string",
    "- primitives: array of 1..200 items",
    "- primitive type enum: line, polygon, circle, text, rect",
    "For each primitive, include needed numeric fields:",
    "- line: x1,y1,x2,y2,stroke,strokeWidth",
    "- polygon: points string like 'x1,y1 x2,y2 ...', fill, stroke, strokeWidth",
    "- circle: cx,cy,r,fill,stroke,strokeWidth",
    "- rect: x,y,width,height,fill,stroke,strokeWidth",
    "- text: x,y,text,fontSize,fill,anchor",
    "Prefer a clean educational style and ensure coordinates fit in canvas."
  ].join("\n");
}

async function generateDiagram(request) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  var model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  var prompt = (request && request.prompt) || "Create a triangle demonstrating the Pythagorean theorem";
  var userPrompt = [
    "User diagram request:",
    prompt,
    "",
    "Return a single DiagramSpec JSON object only."
  ].join("\n");

  var body = {
    model: model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: userPrompt }
    ]
  };

  var response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    var errorText = await response.text();
    throw new Error("OpenAI API error (" + response.status + "): " + errorText);
  }

  var json = await response.json();
  var text = extractTextFromResponse(json);
  var spec;
  try {
    spec = parseJsonFromText(text);
  } catch (err) {
    throw new Error("Failed to parse OpenAI JSON response: " + err.message);
  }

  if (!spec || typeof spec !== "object") {
    throw new Error("OpenAI did not return a valid DiagramSpec JSON object");
  }

  return {
    refinedPrompt: userPrompt,
    spec: spec,
    rawResponse: {
      id: json.id,
      model: json.model
    },
    model: json.model || model,
    usage: json.usage || {}
  };
}

module.exports = {
  generateDiagram
};
