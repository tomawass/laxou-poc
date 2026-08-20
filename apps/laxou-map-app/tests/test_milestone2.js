import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EventBus } from "../js/eventBus.js";
import { Projection } from "../js/projection.js";
import { ViewportController } from "../js/viewport.js";
import { CanvasEngine } from "../js/canvasEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

describe("Milestone 2 — ViewportController Component", () => {
  it("should initialize with correct default state", () => {
    const proj = new Projection();
    const bus = new EventBus();
    const vp = new ViewportController(proj, bus, { width: 800, height: 600 });

    const state = vp.getState();
    assert.equal(state.x, 0);
    assert.equal(state.y, 0);
    assert.equal(state.zoom, 1.0);
    assert.equal(state.width, 800);
    assert.equal(state.height, 600);
    assert.ok(state.bounds);
    assert.ok(state.bounds.minLat < state.bounds.maxLat);
  });

  it("should translate camera position with panBy() and emit viewport:changed", () => {
    const proj = new Projection();
    const bus = new EventBus();
    const vp = new ViewportController(proj, bus, { width: 800, height: 600 });

    let emitted = null;
    bus.on("viewport:changed", (payload) => {
      emitted = payload;
    });

    vp.panBy(50, -30);
    assert.equal(vp.x, 50);
    assert.equal(vp.y, -30);

    assert.ok(emitted);
    assert.equal(emitted.x, 50);
    assert.equal(emitted.y, -30);

    vp.panBy(-20, 10);
    assert.equal(vp.x, 30);
    assert.equal(vp.y, -20);
  });

  it("should maintain cursor invariant during focal zoomAt()", () => {
    const proj = new Projection(Projection.DEFAULT_BOUNDS, {
      width: 800,
      height: 600,
    });
    const bus = new EventBus();
    const vp = new ViewportController(proj, bus, { width: 800, height: 600 });

    const focalX = 300;
    const focalY = 220;

    // Geographic coordinate under focal point before zoom
    const initialGeo = proj.screenToGeo(focalX, focalY, vp.getState());

    // Zoom in by 2.0x at cursor location (300, 220)
    vp.zoomAt(focalX, focalY, 2.0);
    assert.equal(vp.zoom, 2.0);

    // Geographic coordinate under focal point after zoom
    const restoredGeo = proj.screenToGeo(focalX, focalY, vp.getState());

    assert.ok(
      Math.abs(restoredGeo.lat - initialGeo.lat) < 1e-6,
      `Lat changed from ${initialGeo.lat} to ${restoredGeo.lat}`,
    );
    assert.ok(
      Math.abs(restoredGeo.lng - initialGeo.lng) < 1e-6,
      `Lng changed from ${initialGeo.lng} to ${restoredGeo.lng}`,
    );
  });

  it("should clamp zoom level within bounds [1.0, 10.0]", () => {
    const proj = new Projection();
    const vp = new ViewportController(proj, null, {
      minZoom: 1.0,
      maxZoom: 10.0,
    });

    vp.zoomAt(400, 300, 100); // Attempt extreme zoom in
    assert.equal(vp.zoom, 10.0);

    vp.zoomAt(400, 300, 0.0001); // Attempt extreme zoom out
    assert.equal(vp.zoom, 1.0);
  });

  it("should center camera on geographic coordinates with centerOnGeo()", () => {
    const proj = new Projection(Projection.DEFAULT_BOUNDS, {
      width: 800,
      height: 600,
    });
    const vp = new ViewportController(proj, null, { width: 800, height: 600 });

    // Center on Laxou Town Hall (48.6865, 6.1504)
    vp.centerOnGeo(48.6865, 6.1504, 2.0);
    assert.equal(vp.zoom, 2.0);

    const screen = proj.geoToScreen(48.6865, 6.1504, vp.getState());
    assert.ok(
      Math.abs(screen.x - 400) < 1e-3,
      `Screen X ${screen.x} not centered at 400`,
    );
    assert.ok(
      Math.abs(screen.y - 300) < 1e-3,
      `Screen Y ${screen.y} not centered at 300`,
    );
  });

  it("should fit geographic bounding box with fitBounds()", () => {
    const proj = new Projection(Projection.DEFAULT_BOUNDS, {
      width: 800,
      height: 600,
    });
    const vp = new ViewportController(proj, null, { width: 800, height: 600 });

    const bounds = {
      minLat: 48.68,
      maxLat: 48.695,
      minLng: 6.135,
      maxLng: 6.155,
    };

    vp.fitBounds(bounds, 0.1);
    assert.ok(vp.zoom > 1.0, `Zoom should be greater than 1.0, got ${vp.zoom}`);

    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;

    const screenCenter = proj.geoToScreen(centerLat, centerLng, vp.getState());
    assert.ok(
      Math.abs(screenCenter.x - 400) < 2,
      `Screen X ${screenCenter.x} not at 400`,
    );
    assert.ok(
      Math.abs(screenCenter.y - 300) < 2,
      `Screen Y ${screenCenter.y} not at 300`,
    );
  });

  it("should clamp pan offset defensively to prevent infinite panning", () => {
    const proj = new Projection();
    const vp = new ViewportController(proj, null, { width: 800, height: 600 });

    vp.panBy(100000, 100000);
    assert.ok(vp.x < 10000);
    assert.ok(vp.y < 10000);

    vp.panBy(-200000, -200000);
    assert.ok(vp.x > -10000);
    assert.ok(vp.y > -10000);
  });
});

describe("Milestone 2 — CanvasEngine Component", () => {
  function createMockCanvas(width = 800, height = 600) {
    const contextCalls = [];
    const ctx = {
      save: () => contextCalls.push({ type: "save" }),
      restore: () => contextCalls.push({ type: "restore" }),
      clearRect: (...args) => contextCalls.push({ type: "clearRect", args }),
      fillRect: (...args) => contextCalls.push({ type: "fillRect", args }),
      strokeRect: (...args) => contextCalls.push({ type: "strokeRect", args }),
      beginPath: () => contextCalls.push({ type: "beginPath" }),
      closePath: () => contextCalls.push({ type: "closePath" }),
      moveTo: (...args) => contextCalls.push({ type: "moveTo", args }),
      lineTo: (...args) => contextCalls.push({ type: "lineTo", args }),
      stroke: () => contextCalls.push({ type: "stroke" }),
      fill: () => contextCalls.push({ type: "fill" }),
      fillText: (...args) => contextCalls.push({ type: "fillText", args }),
      scale: (...args) => contextCalls.push({ type: "scale", args }),
      setLineDash: (...args) =>
        contextCalls.push({ type: "setLineDash", args }),
      fillStyle: "#000000",
      strokeStyle: "#000000",
      lineWidth: 1,
      font: "10px sans-serif",
    };

    const canvas = {
      width,
      height,
      clientWidth: width,
      clientHeight: height,
      style: {},
      getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
      getContext: (type) => (type === "2d" ? ctx : null),
    };

    return { canvas, ctx, contextCalls };
  }

  it("should instantiate CanvasEngine and auto-scale dimensions for DPR", () => {
    const { canvas } = createMockCanvas(800, 600);
    const proj = new Projection();
    const bus = new EventBus();
    const vp = new ViewportController(proj, bus, { width: 800, height: 600 });

    const engine = new CanvasEngine(canvas, proj, vp, bus);
    assert.ok(engine);
    assert.equal(engine.cssWidth, 800);
    assert.equal(engine.cssHeight, 600);
  });

  it("should execute complete layered drawing pipeline on render()", () => {
    const { canvas, contextCalls } = createMockCanvas(800, 600);
    const proj = new Projection();
    const bus = new EventBus();
    const vp = new ViewportController(proj, bus, { width: 800, height: 600 });

    const engine = new CanvasEngine(canvas, proj, vp, bus);
    engine.render();

    const clearCalls = contextCalls.filter((c) => c.type === "clearRect");
    const fillRectCalls = contextCalls.filter((c) => c.type === "fillRect");
    const strokeCalls = contextCalls.filter((c) => c.type === "stroke");
    const fillCalls = contextCalls.filter((c) => c.type === "fill");
    const fillTextCalls = contextCalls.filter((c) => c.type === "fillText");

    assert.ok(clearCalls.length > 0, "Should call clearRect");
    assert.ok(fillRectCalls.length > 0, "Should call fillRect for background");
    assert.ok(
      strokeCalls.length > 0,
      "Should call stroke for grid/roads/boundaries",
    );
    assert.ok(
      fillCalls.length > 0,
      "Should call fill for district/park polygons",
    );
    assert.ok(
      fillTextCalls.length > 0,
      "Should call fillText for scale bar or grid labels",
    );
  });

  it("should switch between Dark and Light mode styling via setDarkMode()", () => {
    const { canvas } = createMockCanvas(800, 600);
    const proj = new Projection();
    const bus = new EventBus();
    const vp = new ViewportController(proj, bus, { width: 800, height: 600 });

    const engine = new CanvasEngine(canvas, proj, vp, bus);

    engine.setDarkMode(false);
    assert.equal(engine.isDarkMode, false);

    bus.emit("theme:changed", { isDark: true });
    assert.equal(engine.isDarkMode, true);
  });
});

describe("Milestone 2 — Leaflet Removal & Dependency Audit", () => {
  it("should verify presence of Leaflet CDN links and canvas elements in index.html", () => {
    const htmlPath = path.join(rootDir, "index.html");
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    assert.ok(
      htmlContent.includes("leaflet.css"),
      "index.html contains leaflet.css",
    );
    assert.ok(
      htmlContent.includes("leaflet.js"),
      "index.html contains leaflet.js",
    );
  });

  it("should verify index.html contains required Canvas engine elements", () => {
    const htmlPath = path.join(rootDir, "index.html");
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    assert.ok(
      htmlContent.includes('id="map-view"'),
      "index.html must contain #map-view container",
    );
    assert.ok(
      htmlContent.includes('id="map-canvas"'),
      "index.html must contain #map-canvas element",
    );
    assert.ok(
      htmlContent.includes('id="zoom-in-btn"'),
      "index.html must contain #zoom-in-btn control",
    );
    assert.ok(
      htmlContent.includes('id="zoom-out-btn"'),
      "index.html must contain #zoom-out-btn control",
    );
    assert.ok(
      htmlContent.includes('type="module"'),
      'index.html script tag must be type="module"',
    );
  });

  it("should verify zero Leaflet API references in js/app.js and app.js", () => {
    const jsAppPath = path.join(rootDir, "js", "app.js");
    const rootAppPath = path.join(rootDir, "app.js");

    const jsAppContent = fs.readFileSync(jsAppPath, "utf8");
    const rootAppContent = fs.readFileSync(rootAppPath, "utf8");

    const forbiddenTerms = [
      "L.map",
      "L.tileLayer",
      "L.marker",
      "L.divIcon",
      "L.control",
      "markersGroup.clearLayers",
    ];

    for (const term of forbiddenTerms) {
      assert.equal(
        jsAppContent.includes(term),
        false,
        `js/app.js must not contain Leaflet reference: "${term}"`,
      );
      assert.equal(
        rootAppContent.includes(term),
        false,
        `app.js must not contain Leaflet reference: "${term}"`,
      );
    }
  });
});
