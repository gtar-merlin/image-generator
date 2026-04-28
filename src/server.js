require("dotenv").config();
const express = require("express");
const path = require("path");
const diagramService = require("./services/diagramService");
const storage = require("./db/storage");

const app = express();
const port = Number(process.env.PORT || 3000);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", function(_req, res) {
  res.render("index", { defaultProvider: process.env.LLM_PROVIDER || "mock" });
});

app.post("/generate", async function(req, res) {
  const prompt = (req.body.prompt || "").trim();
  const provider = (req.body.provider || "").trim() || process.env.LLM_PROVIDER || "mock";

  if (!prompt) {
    return res.status(400).render("index", {
      error: "Prompt is required",
      defaultProvider: provider
    });
  }

  const result = await diagramService.generateDiagram({ prompt: prompt, provider: provider });
  if (result.status !== "ready") {
    return res.status(422).render("index", {
      error: "Generation failed: " + JSON.stringify(result.errors || []),
      defaultProvider: provider
    });
  }

  res.redirect("/diagrams/" + result.requestId);
});

app.get("/diagrams", function(_req, res) {
  const history = storage.getHistory();
  res.render("history", { history: history });
});

app.get("/diagrams/:id", function(req, res) {
  const data = storage.getDiagramByRequestId(req.params.id);
  if (!data || !data.generation) {
    return res.status(404).send("Diagram not found");
  }

  const svgArtifact = data.artifacts.find(function(a) {
    return a.format === "svg";
  });
  res.render("diagram", {
    diagram: data,
    svg: svgArtifact ? svgArtifact.content : "",
    specJson: JSON.stringify(data.generation.diagramSpec, null, 2),
    compiledJs: data.generation.compiledJs
  });
});

app.get("/api/diagrams/history", function(_req, res) {
  res.json({ items: storage.getHistory() });
});

app.post("/api/diagrams/generate", async function(req, res) {
  const payload = req.body || {};
  const prompt = (payload.prompt || "").trim();
  if (!prompt) {
    return res.status(400).json({ error: "prompt is required" });
  }
  const result = await diagramService.generateDiagram({
    prompt: prompt,
    provider: payload.provider || process.env.LLM_PROVIDER || "mock",
    settings: payload.settings || {}
  });
  if (result.status !== "ready") {
    return res.status(422).json(result);
  }
  res.status(201).json(result);
});

app.get("/api/diagrams/:id", function(req, res) {
  const data = storage.getDiagramByRequestId(req.params.id);
  if (!data || !data.generation) return res.status(404).json({ error: "not found" });
  res.json({
    id: data.request.id,
    prompt: data.request.originalPrompt,
    status: data.request.status,
    provider: data.generation.provider,
    model: data.generation.model
  });
});

app.get("/api/diagrams/:id/html", function(req, res) {
  const data = storage.getDiagramByRequestId(req.params.id);
  if (!data || !data.generation) return res.status(404).json({ error: "not found" });
  const svgArtifact = data.artifacts.find(function(a) {
    return a.format === "svg";
  });
  res.type("text/html").send(
    "<!doctype html><html><body style='margin:0;padding:0'>" + (svgArtifact ? svgArtifact.content : "") + "</body></html>"
  );
});

app.get("/api/diagrams/:id/image", function(req, res) {
  const data = storage.getDiagramByRequestId(req.params.id);
  if (!data || !data.generation) return res.status(404).json({ error: "not found" });
  const svgArtifact = data.artifacts.find(function(a) {
    return a.format === "svg";
  });
  // This initial slice returns SVG image data. PNG/JPG worker is the next implementation step.
  res.type("image/svg+xml").send(svgArtifact ? svgArtifact.content : "");
});

app.listen(port, function() {
  console.log("diaggen listening on http://localhost:" + port);
});
