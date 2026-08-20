import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { EventBus } from "../js/eventBus.js";
import { Projection } from "../js/projection.js";
import { ViewportController } from "../js/viewport.js";
import { CanvasEngine } from "../js/canvasEngine.js";

function createMockCanvas(width = 800, height = 600) {
  const contextCalls = [];
  let saveDepth = 0;

  const ctx = {
    save: () => {
      saveDepth++;
      contextCalls.push({ type: "save", depth: saveDepth });
    },
    restore: () => {
      contextCalls.push({ type: "restore", depth: saveDepth });
      saveDepth--;
    },
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
    setLineDash: (...args) => contextCalls.push({ type: "setLineDash", args }),
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    font: "10px sans-serif",
    textAlign: "left",
    lineCap: "butt",
    lineJoin: "miter",
    getSaveDepth: () => saveDepth,
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

describe("Challenger 2 — CanvasEngine & Viewport Stress Test Suite", () => {
  // =========================================================================
  // 1. RAPID VIEWPORT PAN / ZOOM STABILITY
  // =========================================================================
  describe("1. Rapid Viewport Pan & Zoom Stability", () => {
    it("should handle 1,000 rapid panBy calls without coordinate drift or NaN", () => {
      const proj = new Projection();
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const { canvas } = createMockCanvas(800, 600);
      const engine = new CanvasEngine(canvas, proj, vp, bus);

      for (let i = 0; i < 1000; i++) {
        const dx = i % 2 === 0 ? 15 : -12;
        const dy = i % 3 === 0 ? -10 : 8;
        vp.panBy(dx, dy);
      }

      const state = vp.getState();
      assert.ok(isFinite(state.x), `state.x must be finite, got ${state.x}`);
      assert.ok(isFinite(state.y), `state.y must be finite, got ${state.y}`);
      assert.ok(
        isFinite(state.zoom),
        `state.zoom must be finite, got ${state.zoom}`,
      );
      assert.ok(state.bounds.minLat < state.bounds.maxLat);
      assert.ok(state.bounds.minLng < state.bounds.maxLng);
    });

    it("should handle rapid alternating zoomAt operations with varying focal points", () => {
      const proj = new Projection();
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });

      const focalPoints = [
        { x: 400, y: 300 }, // Center
        { x: 0, y: 0 }, // Top-Left
        { x: 800, y: 600 }, // Bottom-Right
        { x: 120, y: 450 }, // Arbitrary
      ];

      for (let i = 0; i < 500; i++) {
        const pt = focalPoints[i % focalPoints.length];
        const factor = i % 2 === 0 ? 1.05 : 0.95;
        vp.zoomAt(pt.x, pt.y, factor);
      }

      const state = vp.getState();
      assert.ok(
        state.zoom >= 1.0 && state.zoom <= 10.0,
        `Zoom ${state.zoom} out of bounds [1, 10]`,
      );
      assert.ok(isFinite(state.x));
      assert.ok(isFinite(state.y));
    });

    it("should coalesce dirty-flag requestRedraw() calls when requestAnimationFrame is available", () => {
      // Mock requestAnimationFrame
      let pendingCb = null;
      global.requestAnimationFrame = (cb) => {
        pendingCb = cb;
        return 123;
      };

      const proj = new Projection();
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const { canvas } = createMockCanvas(800, 600);
      const engine = new CanvasEngine(canvas, proj, vp, bus);

      let renderCount = 0;
      const originalRender = engine.render.bind(engine);
      engine.render = () => {
        renderCount++;
        originalRender();
      };

      // Trigger 100 rapid viewport changes synchronously
      for (let i = 0; i < 100; i++) {
        engine.requestRedraw();
      }

      assert.ok(pendingCb !== null, "rAF callback should be scheduled");
      assert.equal(
        renderCount,
        0,
        "render() should not be called synchronously when rAF is pending",
      );

      // Now fire animation frame callback
      pendingCb();

      assert.equal(
        renderCount,
        1,
        `Expected exactly 1 render call, got ${renderCount}`,
      );
      assert.equal(
        engine.needsRedraw,
        false,
        "needsRedraw should be reset after render",
      );

      delete global.requestAnimationFrame;
    });
  });

  // =========================================================================
  // 2. CANVAS RESIZING & HIGH/LOW DPR SCALING
  // =========================================================================
  describe("2. Canvas Resizing & High/Low DPR Values", () => {
    it("should scale canvas buffer correctly for High DPR=3.0 (Retina Display)", () => {
      const originalDPR = global.window?.devicePixelRatio;
      global.window = { devicePixelRatio: 3.0, addEventListener: () => {} };

      const proj = new Projection();
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const { canvas } = createMockCanvas(800, 600);

      const engine = new CanvasEngine(canvas, proj, vp, bus);

      assert.equal(engine.dpr, 3.0);
      assert.equal(
        canvas.width,
        2400,
        `Canvas buffer width should be 800 * 3 = 2400, got ${canvas.width}`,
      );
      assert.equal(
        canvas.height,
        1800,
        `Canvas buffer height should be 600 * 3 = 1800, got ${canvas.height}`,
      );
      assert.equal(canvas.style.width, "800px");
      assert.equal(canvas.style.height, "600px");

      if (originalDPR !== undefined)
        global.window.devicePixelRatio = originalDPR;
      else delete global.window;
    });

    it("should scale canvas buffer correctly for Low DPR=0.5", () => {
      global.window = { devicePixelRatio: 0.5, addEventListener: () => {} };

      const proj = new Projection();
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const { canvas } = createMockCanvas(800, 600);

      const engine = new CanvasEngine(canvas, proj, vp, bus);

      assert.equal(engine.dpr, 0.5);
      assert.equal(
        canvas.width,
        400,
        `Canvas buffer width should be 800 * 0.5 = 400, got ${canvas.width}`,
      );
      assert.equal(
        canvas.height,
        300,
        `Canvas buffer height should be 600 * 0.5 = 300, got ${canvas.height}`,
      );
      assert.equal(canvas.style.width, "800px");
      assert.equal(canvas.style.height, "600px");

      delete global.window;
    });

    it("should handle zero or fallback dimensions gracefully on resize", () => {
      const proj = new Projection();
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const { canvas } = createMockCanvas(0, 0); // 0x0 container rect

      const engine = new CanvasEngine(canvas, proj, vp, bus);
      assert.equal(engine.cssWidth, 800, "Should fall back to 800 default");
      assert.equal(engine.cssHeight, 600, "Should fall back to 600 default");
    });

    it("should check if CanvasEngine updates canvas DOM buffer size on container resize via viewport:changed", () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, {
        width: 800,
        height: 600,
      });
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const { canvas } = createMockCanvas(800, 600);
      const engine = new CanvasEngine(canvas, proj, vp, bus);

      // Simulate container resize (e.g., sidebar opened, changing container width to 1200x900)
      canvas.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        width: 1200,
        height: 900,
      });

      // ViewportController detects container resize via ResizeObserver and updates state
      vp.setDimensions(1200, 900); // Emits viewport:changed

      // Check if CanvasEngine automatically resized its canvas buffer or css dimensions
      engine.render();

      assert.equal(
        engine.cssWidth,
        1200,
        `CanvasEngine.cssWidth should be updated to 1200 on container resize, got ${engine.cssWidth}`,
      );
      assert.equal(
        canvas.width,
        1200,
        `canvas.width buffer should be updated to 1200 on container resize, got ${canvas.width}`,
      );
    });
  });

  // =========================================================================
  // 3. DYNAMIC METRIC SCALE BAR CALCULATIONS
  // =========================================================================
  describe("3. Dynamic Metric Scale Bar Calculations", () => {
    it("should compute valid scale bar pixel widths and metric step values across all zoom levels z=1..10", () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, {
        width: 800,
        height: 600,
      });
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const { canvas, contextCalls } = createMockCanvas(800, 600);
      const engine = new CanvasEngine(canvas, proj, vp, bus);

      const zoomLevels = [1.0, 1.5, 2.0, 3.5, 5.0, 7.5, 10.0];

      zoomLevels.forEach((zoom) => {
        vp.zoomAt(400, 300, zoom / vp.zoom);
        contextCalls.length = 0;
        engine.render();

        const textCalls = contextCalls.filter((c) => c.type === "fillText");
        const scaleText = textCalls.find(
          (c) =>
            typeof c.args[0] === "string" &&
            (c.args[0].endsWith("m") || c.args[0].endsWith("km")),
        );

        assert.ok(scaleText, `Scale bar text missing at zoom level ${zoom}`);
        const label = scaleText.args[0];
        assert.ok(
          label.match(/^\d+(\.\d+)?\s*(m|km)$/),
          `Scale bar text format invalid: "${label}"`,
        );
      });
    });

    it("should accurately match physical pixel distance to calculated meters per pixel", () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, {
        width: 800,
        height: 600,
      });
      const vp = new ViewportController(proj, null, {
        width: 800,
        height: 600,
      });
      const { canvas } = createMockCanvas(800, 600);
      const engine = new CanvasEngine(canvas, proj, vp, null);

      const centerLat = proj.getCenter().lat; // ~48.6865
      const centerCos = Math.cos((centerLat * Math.PI) / 180);
      const degPerPx = proj.bounds.dLng / (proj.baseWidth * vp.zoom);
      const metersPerPx = degPerPx * 111320 * centerCos;

      // At zoom 1.0, baseWidth ~736.94px, degPerPx ~0.00010855, metersPerPx ~7.978m/px
      assert.ok(
        metersPerPx > 5.0 && metersPerPx < 12.0,
        `Calculated meters per px ${metersPerPx} out of expected range for Laxou at z=1`,
      );
    });
  });

  // =========================================================================
  // 4. CANVAS CONTEXT LIFECYCLE & RESILIENCE
  // =========================================================================
  describe("4. Canvas Context Lifecycle & Exception Resilience", () => {
    it("should maintain balanced ctx.save() and ctx.restore() depth across render frames", () => {
      const proj = new Projection();
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const { canvas, ctx } = createMockCanvas(800, 600);
      const engine = new CanvasEngine(canvas, proj, vp, bus);

      engine.render();
      assert.equal(
        ctx.getSaveDepth(),
        0,
        `Context save depth must be 0 after render, got ${ctx.getSaveDepth()}`,
      );

      engine.render();
      assert.equal(
        ctx.getSaveDepth(),
        0,
        `Context save depth must be 0 after second render pass, got ${ctx.getSaveDepth()}`,
      );
    });

    it("should render all vector layers (background, grid, districts, parks, waterways, roads, scalebar) cleanly", () => {
      const proj = new Projection();
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const { canvas, contextCalls } = createMockCanvas(800, 600);
      const engine = new CanvasEngine(canvas, proj, vp, bus);

      engine.render();

      const lineToCalls = contextCalls.filter((c) => c.type === "lineTo");
      const strokeCalls = contextCalls.filter((c) => c.type === "stroke");
      const fillCalls = contextCalls.filter((c) => c.type === "fill");

      assert.ok(
        lineToCalls.length > 50,
        `Expected >50 lineTo calls for vector geometry, got ${lineToCalls.length}`,
      );
      assert.ok(
        strokeCalls.length > 5,
        `Expected >5 stroke calls, got ${strokeCalls.length}`,
      );
      assert.ok(
        fillCalls.length >= 4,
        `Expected at least 4 district/park fill calls, got ${fillCalls.length}`,
      );
    });
  });
});
