function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPrimitive(p) {
  if (p.type === "line") {
    return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke="${esc(p.stroke || "#111")}" stroke-width="${p.strokeWidth || 2}" />`;
  }
  if (p.type === "polygon") {
    return `<polygon points="${esc(p.points || "")}" fill="${esc(p.fill || "none")}" stroke="${esc(p.stroke || "#111")}" stroke-width="${p.strokeWidth || 2}" />`;
  }
  if (p.type === "circle") {
    return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${esc(p.fill || "none")}" stroke="${esc(p.stroke || "#111")}" stroke-width="${p.strokeWidth || 2}" />`;
  }
  if (p.type === "rect") {
    return `<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="${esc(p.fill || "none")}" stroke="${esc(p.stroke || "#111")}" stroke-width="${p.strokeWidth || 2}" />`;
  }
  if (p.type === "text") {
    return `<text x="${p.x}" y="${p.y}" fill="${esc(p.fill || "#111")}" font-size="${p.fontSize || 16}" text-anchor="${esc(p.anchor || "start")}">${esc(p.text || "")}</text>`;
  }
  return "";
}

function renderSpecToSvg(spec) {
  const width = spec.width || 800;
  const height = spec.height || 600;
  const background = spec.background || "#fff";
  const body = (spec.primitives || []).map(renderPrimitive).join("\n");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="${esc(background)}" />`,
    body,
    "</svg>"
  ].join("\n");
}

module.exports = {
  renderSpecToSvg
};
