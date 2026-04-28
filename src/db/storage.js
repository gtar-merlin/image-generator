const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DB_PATH = path.join(__dirname, "../../data/local-db.json");

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { requests: [], generations: [], artifacts: [], auditEvents: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function createRequest(input) {
  const db = readDb();
  const now = new Date().toISOString();
  const row = {
    id: uuidv4(),
    originalPrompt: input.prompt,
    settings: input.settings || {},
    status: "queued",
    createdAt: now,
    updatedAt: now
  };
  db.requests.push(row);
  writeDb(db);
  return row;
}

function createGeneration(input) {
  const db = readDb();
  const row = {
    id: uuidv4(),
    requestId: input.requestId,
    provider: input.provider,
    model: input.model,
    refinedPrompt: input.refinedPrompt,
    diagramSpec: input.diagramSpec,
    compiledJs: input.compiledJs || "",
    validationResult: input.validationResult || {},
    rawProviderResponse: input.rawProviderResponse || {},
    status: input.status || "succeeded",
    createdAt: new Date().toISOString()
  };
  db.generations.push(row);
  writeDb(db);
  return row;
}

function createArtifact(input) {
  const db = readDb();
  const row = {
    id: uuidv4(),
    generationId: input.generationId,
    type: input.type,
    format: input.format,
    content: input.content,
    createdAt: new Date().toISOString()
  };
  db.artifacts.push(row);
  writeDb(db);
  return row;
}

function updateRequestStatus(requestId, status) {
  const db = readDb();
  const request = db.requests.find(function(r) {
    return r.id === requestId;
  });
  if (request) {
    request.status = status;
    request.updatedAt = new Date().toISOString();
  }
  writeDb(db);
}

function getDiagramByRequestId(requestId) {
  const db = readDb();
  const request = db.requests.find(function(r) {
    return r.id === requestId;
  });
  if (!request) return null;
  const generation = db.generations.find(function(g) {
    return g.requestId === requestId;
  });
  const artifacts = db.artifacts.filter(function(a) {
    return generation && a.generationId === generation.id;
  });
  return { request: request, generation: generation, artifacts: artifacts };
}

function getHistory() {
  const db = readDb();
  return db.requests
    .slice()
    .sort(function(a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .map(function(r) {
      const generation = db.generations.find(function(g) {
        return g.requestId === r.id;
      });
      return {
        id: r.id,
        prompt: r.originalPrompt,
        status: r.status,
        provider: generation ? generation.provider : null,
        createdAt: r.createdAt
      };
    });
}

module.exports = {
  createRequest,
  createGeneration,
  createArtifact,
  updateRequestStatus,
  getDiagramByRequestId,
  getHistory
};
