import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Projection } from '../js/projection.js';
import { EventBus } from '../js/eventBus.js';
import { ViewportController } from '../js/viewport.js';

if (typeof globalThis.HTMLElement === 'undefined') {
  globalThis.HTMLElement = class HTMLElement {};
}

/**
 * Mock DOM Element helper for simulating browser event listeners in Node.js
 */
function createMockElement(width = 800, height = 600) {
  const listeners = new Map();
  const el = Object.create(globalThis.HTMLElement.prototype);
  Object.assign(el, {
    style: {},
    clientWidth: width,
    clientHeight: height,
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener: (type, fn) => {
      if (!listeners.has(type)) return;
      const arr = listeners.get(type).filter(l => l !== fn);
      listeners.set(type, arr);
    },
    dispatchMockEvent: (type, eventData) => {
      const fns = listeners.get(type) || [];
      const event = {
        preventDefault: () => {},
        stopPropagation: () => {},
        ...eventData
      };
      for (const fn of fns) {
        fn(event);
      }
    }
  });
  return el;
}

describe('Adversarial Stress Suite — ViewportController (Challenger 1, M2)', () => {

  // =========================================================================
  // 1. CAMERA BOUNDS CLAMPING WITH EXTREME VALUES
  // =========================================================================
  describe('1. Camera Bounds Clamping with Extreme Values', () => {

    it('1.1 should handle extreme positive and negative panBy values (Infinity, 1e30, -1e30)', () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, { width: 800, height: 600 });
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });

      // Pan to infinity positive
      vp.panBy(Infinity, Infinity);
      assert.ok(isFinite(vp.x), `vp.x must remain finite, got ${vp.x}`);
      assert.ok(isFinite(vp.y), `vp.y must remain finite, got ${vp.y}`);
      assert.ok(!Number.isNaN(vp.x) && !Number.isNaN(vp.y), 'x and y must not be NaN');

      // Pan to infinity negative
      vp.panBy(-Infinity, -Infinity);
      assert.ok(isFinite(vp.x), `vp.x must remain finite, got ${vp.x}`);
      assert.ok(isFinite(vp.y), `vp.y must remain finite, got ${vp.y}`);
      assert.ok(!Number.isNaN(vp.x) && !Number.isNaN(vp.y), 'x and y must not be NaN');

      // Extreme numbers
      vp.panBy(1e30, -1e30);
      assert.ok(isFinite(vp.x) && isFinite(vp.y));
    });

    it('1.2 should handle malformed panBy inputs (NaN, null, undefined, strings, objects)', () => {
      const proj = new Projection();
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });

      const initialX = vp.x;
      const initialY = vp.y;

      const malformedInputs = [
        [NaN, NaN],
        [null, undefined],
        ['invalid', 'string'],
        [{}, []]
      ];

      for (const [dx, dy] of malformedInputs) {
        assert.doesNotThrow(() => {
          vp.panBy(dx, dy);
        }, `panBy failed on input [${String(dx)}, ${String(dy)}]`);

        assert.ok(isFinite(vp.x), `vp.x corrupt on [${String(dx)}, ${String(dy)}]: ${vp.x}`);
        assert.ok(isFinite(vp.y), `vp.y corrupt on [${String(dx)}, ${String(dy)}]: ${vp.y}`);
      }
    });

    it('1.3 should verify camera bounds clamping limits at various zoom levels (z=1.0, z=2.5, z=5.0, z=10.0)', () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, { width: 800, height: 600 });
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });

      const zoomLevels = [1.0, 2.5, 5.0, 10.0];

      for (const z of zoomLevels) {
        vp.zoom = z;
        vp.panBy(50000, 50000); // Max positive pan attempt

        const baseW = (proj.baseWidth || 800) * z;
        const baseH = (proj.baseHeight || 600) * z;
        const expectedMaxX = Math.max(0, (baseW - 800) / 2 + 0.25 * 800);
        const expectedMaxY = Math.max(0, (baseH - 600) / 2 + 0.25 * 600);

        assert.ok(
          Math.abs(vp.x - expectedMaxX) < 1e-5,
          `At zoom ${z}, vp.x ${vp.x} did not clamp to expected maxX ${expectedMaxX}`
        );
        assert.ok(
          Math.abs(vp.y - expectedMaxY) < 1e-5,
          `At zoom ${z}, vp.y ${vp.y} did not clamp to expected maxY ${expectedMaxY}`
        );

        vp.panBy(-100000, -100000); // Max negative pan attempt
        assert.ok(
          Math.abs(vp.x - (-expectedMaxX)) < 1e-5,
          `At zoom ${z}, vp.x ${vp.x} did not clamp to expected -maxX ${-expectedMaxX}`
        );
        assert.ok(
          Math.abs(vp.y - (-expectedMaxY)) < 1e-5,
          `At zoom ${z}, vp.y ${vp.y} did not clamp to expected -maxY ${-expectedMaxY}`
        );
      }
    });

    it('1.4 should handle extreme setDimensions calls (0x0, negative, NaN, ultra-huge)', () => {
      const proj = new Projection();
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });

      const invalidDims = [
        [0, 0],
        [-100, -500],
        [NaN, NaN],
        [Infinity, Infinity],
        ['abc', 'def']
      ];

      for (const [w, h] of invalidDims) {
        vp.setDimensions(w, h);
        assert.ok(vp.width > 0, `width must remain positive for input [${w}, ${h}]`);
        assert.ok(vp.height > 0, `height must remain positive for input [${w}, ${h}]`);
        assert.ok(isFinite(vp.width) && isFinite(vp.height));
      }

      // Valid huge size
      vp.setDimensions(10000, 8000);
      assert.equal(vp.width, 10000);
      assert.equal(vp.height, 8000);
    });
  });

  // =========================================================================
  // 2. ZOOM LEVELS AT BOUNDARIES & FLOATING POINT EDGE CASES
  // =========================================================================
  describe('2. Zoom Levels at Boundaries & Floating Point Edge Cases', () => {

    it('2.1 should strictly clamp zoom to [minZoom, maxZoom] under extreme zoomAt multipliers', () => {
      const proj = new Projection();
      const vp = new ViewportController(proj, null, { minZoom: 1.0, maxZoom: 10.0 });

      // Zoom in by factor 1e6
      vp.zoomAt(400, 300, 1e6);
      assert.equal(vp.zoom, 10.0, `Zoom should be capped at maxZoom 10.0, got ${vp.zoom}`);

      // Zoom out by factor 1e-6
      vp.zoomAt(400, 300, 1e-6);
      assert.equal(vp.zoom, 1.0, `Zoom should be floored at minZoom 1.0, got ${vp.zoom}`);

      // Negative multiplier
      vp.zoomAt(400, 300, -5.0);
      assert.equal(vp.zoom, 1.0, 'Negative zoom factor should be ignored');

      // Zero multiplier
      vp.zoomAt(400, 300, 0);
      assert.equal(vp.zoom, 1.0, 'Zero zoom factor should be ignored');
    });

    it('2.2 should clamp out-of-bounds zoom in centerOnGeo and fitBounds', () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, { width: 800, height: 600 });
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });

      // centerOnGeo with z < 1.0
      vp.centerOnGeo(48.6865, 6.1504, 0.2);
      assert.equal(vp.zoom, 1.0, `centerOnGeo zoom level 0.2 should clamp to 1.0, got ${vp.zoom}`);

      // centerOnGeo with z > 10.0
      vp.centerOnGeo(48.6865, 6.1504, 25.0);
      assert.equal(vp.zoom, 10.0, `centerOnGeo zoom level 25.0 should clamp to 10.0, got ${vp.zoom}`);

      // centerOnGeo with NaN zoom
      vp.centerOnGeo(48.6865, 6.1504, NaN);
      assert.equal(vp.zoom, 10.0, 'centerOnGeo with NaN zoom should preserve previous zoom');
    });

    it('2.3 should preserve exact non-integer zoom levels (z = 1.337, z = 2.71828, z = Math.PI)', () => {
      const proj = new Projection();
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });

      const testZooms = [1.337, 2.71828, Math.PI, 9.99999];

      for (const z of testZooms) {
        vp.zoomAt(400, 300, z / vp.zoom);
        assert.ok(
          Math.abs(vp.zoom - z) < 1e-6,
          `Expected zoom ${z}, got ${vp.zoom}`
        );
        const state = vp.getState();
        assert.equal(state.zoom, vp.zoom);
      }
    });

    it('2.4 should honor epsilon zoom threshold and prevent event emission on negligible zoom delta', () => {
      const bus = new EventBus();
      const proj = new Projection();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600, zoom: 2.0 });

      let emitCount = 0;
      bus.on('viewport:changed', () => {
        emitCount++;
      });

      // Factor 1.0000000000000002 should yield delta < 1e-6
      vp.zoomAt(400, 300, 1.0000000000000002);
      assert.equal(emitCount, 0, 'No viewport:changed event should be emitted for sub-epsilon zoom delta');

      // Factor 1.1 should emit event
      vp.zoomAt(400, 300, 1.1);
      assert.equal(emitCount, 1, 'Event should be emitted for significant zoom delta');
    });

    it('2.5 should gracefully reject malformed zoomAt arguments (NaN focal, Infinity factor, non-numeric)', () => {
      const proj = new Projection();
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });

      const initialZoom = vp.zoom;
      const initialX = vp.x;

      vp.zoomAt(NaN, 300, 1.5);
      assert.equal(vp.zoom, initialZoom);
      assert.equal(vp.x, initialX);

      vp.zoomAt(400, undefined, 1.5);
      assert.equal(vp.zoom, initialZoom);

      vp.zoomAt(400, 300, Infinity);
      assert.equal(vp.zoom, initialZoom);

      vp.zoomAt(400, 300, 'invalid');
      assert.equal(vp.zoom, initialZoom);
    });
  });

  // =========================================================================
  // 3. CURSOR-ANCHORED WHEEL ZOOM MATH & ZERO FOCAL DRIFT
  // =========================================================================
  describe('3. Cursor-Anchored Wheel Zoom Math & Zero Focal Drift', () => {

    it('3.1 should maintain exact focal point invariant on arbitrary cursor position across zoom in/out', () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, { width: 800, height: 600 });
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });

      const focalPoints = [
        { x: 314.15, y: 271.82 },
        { x: 50.0, y: 550.0 },
        { x: 750.0, y: 100.0 },
        { x: 400.0, y: 300.0 }
      ];

      for (const fp of focalPoints) {
        vp.zoom = 2.0;
        vp.x = 0;
        vp.y = 0;

        const initialGeo = proj.screenToGeo(fp.x, fp.y, vp.getState());

        // Zoom in 1.8x
        vp.zoomAt(fp.x, fp.y, 1.8);
        const geoAfterZoomIn = proj.screenToGeo(fp.x, fp.y, vp.getState());

        assert.ok(
          Math.abs(geoAfterZoomIn.lat - initialGeo.lat) < 1e-10,
          `Focal lat mismatch after zoom in at (${fp.x}, ${fp.y}): expected ${initialGeo.lat}, got ${geoAfterZoomIn.lat}`
        );
        assert.ok(
          Math.abs(geoAfterZoomIn.lng - initialGeo.lng) < 1e-10,
          `Focal lng mismatch after zoom in at (${fp.x}, ${fp.y}): expected ${initialGeo.lng}, got ${geoAfterZoomIn.lng}`
        );

        // Zoom back out by 1/1.8
        vp.zoomAt(fp.x, fp.y, 1.0 / 1.8);
        const geoAfterZoomOut = proj.screenToGeo(fp.x, fp.y, vp.getState());

        assert.ok(
          Math.abs(geoAfterZoomOut.lat - initialGeo.lat) < 1e-10,
          `Focal lat mismatch after zoom out at (${fp.x}, ${fp.y}): expected ${initialGeo.lat}, got ${geoAfterZoomOut.lat}`
        );
        assert.ok(
          Math.abs(geoAfterZoomOut.lng - initialGeo.lng) < 1e-10,
          `Focal lng mismatch after zoom out at (${fp.x}, ${fp.y}): expected ${initialGeo.lng}, got ${geoAfterZoomOut.lng}`
        );
      }
    });

    it('3.2 should exhibit ZERO focal drift over 10,000 rapid random zoom transitions', () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, { width: 800, height: 600 });
      const vp = new ViewportController(proj, null, { width: 800, height: 600, minZoom: 1.0, maxZoom: 10.0 });

      // Choose a fixed focal point inside canvas
      const focalX = 520.5;
      const focalY = 180.25;

      vp.zoom = 2.0;
      vp.x = 0;
      vp.y = 0;

      const targetGeo = proj.screenToGeo(focalX, focalY, vp.getState());

      // Perform 10,000 rapid zoom operations, keeping zoom strictly between 1.5 and 8.5
      // to avoid hitting camera pan bounds clamping (which naturally shifts camera if map edge is reached)
      for (let i = 0; i < 10000; i++) {
        let zoomFactor;
        if (vp.zoom > 7.0) {
          zoomFactor = 0.85 + Math.random() * 0.1; // Force zoom out
        } else if (vp.zoom < 2.0) {
          zoomFactor = 1.1 + Math.random() * 0.15; // Force zoom in
        } else {
          zoomFactor = Math.random() > 0.5 ? (1.02 + Math.random() * 0.1) : (0.90 + Math.random() * 0.08);
        }

        vp.zoomAt(focalX, focalY, zoomFactor);
      }

      const currentGeo = proj.screenToGeo(focalX, focalY, vp.getState());

      const latDrift = Math.abs(currentGeo.lat - targetGeo.lat);
      const lngDrift = Math.abs(currentGeo.lng - targetGeo.lng);

      assert.ok(
        latDrift < 1e-9,
        `10,000 zoom transitions produced lat drift of ${latDrift}`
      );
      assert.ok(
        lngDrift < 1e-9,
        `10,000 zoom transitions produced lng drift of ${lngDrift}`
      );
    });

    it('3.3 should handle focal zoom at outer canvas corners (0,0), (800,600) and off-canvas coordinates (-100,-100)', () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, { width: 800, height: 600 });
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });

      const extremeFocals = [
        { x: 0, y: 0 },
        { x: 800, y: 0 },
        { x: 0, y: 600 },
        { x: 800, y: 600 },
        { x: -200, y: -200 },
        { x: 1200, y: 1000 }
      ];

      for (const fp of extremeFocals) {
        vp.zoom = 2.0;
        vp.x = 0;
        vp.y = 0;

        assert.doesNotThrow(() => {
          vp.zoomAt(fp.x, fp.y, 1.25);
        });

        assert.ok(isFinite(vp.x) && isFinite(vp.y) && isFinite(vp.zoom));
        assert.ok(!Number.isNaN(vp.x) && !Number.isNaN(vp.y));
      }
    });
  });

  // =========================================================================
  // 4. GESTURE PAN STATE TRANSITIONS & DOUBLE-CLICK / BUTTON ZOOM
  // =========================================================================
  describe('4. Gesture Pan State Transitions & Double-Click / Button Zoom', () => {

    it('4.1 should manage complete pointer drag lifecycle (pointerdown -> pointermove x100 -> pointerup)', () => {
      const proj = new Projection();
      const bus = new EventBus();
      const vp = new ViewportController(proj, bus, { width: 800, height: 600 });
      const mockContainer = createMockElement(800, 600);

      vp.attachEventListeners(mockContainer);
      vp.zoom = 2.0; // At zoom 2.0, maxX is > 200px allowing 200px pan without hitting bounds clamp limit

      assert.equal(vp.isDragging, false);
      assert.equal(mockContainer.style.cursor, 'grab');

      // 1. Pointer Down
      mockContainer.dispatchMockEvent('pointerdown', {
        button: 0,
        clientX: 200,
        clientY: 150,
        pointerId: 42
      });

      assert.equal(vp.isDragging, true);
      assert.equal(vp.activePointerId, 42);
      assert.equal(mockContainer.style.cursor, 'grabbing');
      assert.equal(vp.lastPointerX, 200);
      assert.equal(vp.lastPointerY, 150);

      // 2. 100 Pointer Moves
      let expectedX = 0;
      let expectedY = 0;

      for (let i = 1; i <= 100; i++) {
        const curX = 200 + i * 2;
        const curY = 150 - i * 1;

        mockContainer.dispatchMockEvent('pointermove', {
          clientX: curX,
          clientY: curY,
          pointerId: 42
        });

        expectedX += 2;
        expectedY -= 1;
      }

      assert.equal(vp.x, expectedX);
      assert.equal(vp.y, expectedY);

      // 3. Pointer Up
      mockContainer.dispatchMockEvent('pointerup', {
        pointerId: 42
      });

      assert.equal(vp.isDragging, false);
      assert.equal(vp.activePointerId, null);
      assert.equal(mockContainer.style.cursor, 'grab');
    });

    it('4.2 should reset drag state on pointerleave, pointercancel, and ignore non-primary mouse buttons', () => {
      const proj = new Projection();
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });
      const mockContainer = createMockElement(800, 600);

      vp.attachEventListeners(mockContainer);

      // Ignore right click (button 2)
      mockContainer.dispatchMockEvent('pointerdown', { button: 2, clientX: 100, clientY: 100, pointerId: 1 });
      assert.equal(vp.isDragging, false);

      // Ignore middle click (button 1)
      mockContainer.dispatchMockEvent('pointerdown', { button: 1, clientX: 100, clientY: 100, pointerId: 1 });
      assert.equal(vp.isDragging, false);

      // Down then leave
      mockContainer.dispatchMockEvent('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 5 });
      assert.equal(vp.isDragging, true);

      mockContainer.dispatchMockEvent('pointerleave', { pointerId: 5 });
      assert.equal(vp.isDragging, false);
      assert.equal(mockContainer.style.cursor, 'grab');

      // Down then cancel
      mockContainer.dispatchMockEvent('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 6 });
      assert.equal(vp.isDragging, true);

      mockContainer.dispatchMockEvent('pointercancel', { pointerId: 6 });
      assert.equal(vp.isDragging, false);
    });

    it('4.3 should handle multi-pointer touch interaction without state corruption', () => {
      const proj = new Projection();
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });
      const mockContainer = createMockElement(800, 600);

      vp.attachEventListeners(mockContainer);

      // Pointer 1 downs
      mockContainer.dispatchMockEvent('pointerdown', { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
      assert.equal(vp.activePointerId, 1);

      // Pointer 2 downs (secondary touch point)
      mockContainer.dispatchMockEvent('pointerdown', { button: 0, clientX: 200, clientY: 200, pointerId: 2 });
      assert.equal(vp.activePointerId, 2);

      // Move with Pointer 1 (should be ignored since active is 2)
      const prevX = vp.x;
      mockContainer.dispatchMockEvent('pointermove', { clientX: 150, clientY: 150, pointerId: 1 });
      assert.equal(vp.x, prevX);

      // Move with Pointer 2 (should pan)
      mockContainer.dispatchMockEvent('pointermove', { clientX: 210, clientY: 210, pointerId: 2 });
      assert.equal(vp.x, prevX + 10);

      // Pointer 1 up (should be ignored since active is 2)
      mockContainer.dispatchMockEvent('pointerup', { pointerId: 1 });
      assert.equal(vp.isDragging, true);

      // Pointer 2 up (active pointer released)
      mockContainer.dispatchMockEvent('pointerup', { pointerId: 2 });
      assert.equal(vp.isDragging, false);
      assert.equal(vp.activePointerId, null);
    });

    it('4.4 should correctly scale wheel delta across deltaMode 0 (pixel), 1 (line), and 2 (page)', () => {
      const proj = new Projection();
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });
      const mockContainer = createMockElement(800, 600);

      vp.attachEventListeners(mockContainer);

      // Pixel mode (0): deltaY = 100
      vp.zoom = 2.0;
      mockContainer.dispatchMockEvent('wheel', { clientX: 400, clientY: 300, deltaY: 100, deltaMode: 0 });
      const zoomPixel = vp.zoom;
      assert.ok(zoomPixel < 2.0, `Wheel scroll down should zoom out: got ${zoomPixel}`);

      // Line mode (1): deltaY = 5
      vp.zoom = 2.0;
      mockContainer.dispatchMockEvent('wheel', { clientX: 400, clientY: 300, deltaY: 5, deltaMode: 1 });
      const zoomLine = vp.zoom;
      assert.ok(zoomLine < 2.0, `Wheel line mode scroll should zoom out: got ${zoomLine}`);

      // Page mode (2): deltaY = 1
      vp.zoom = 2.0;
      mockContainer.dispatchMockEvent('wheel', { clientX: 400, clientY: 300, deltaY: 1, deltaMode: 2 });
      const zoomPage = vp.zoom;
      assert.ok(zoomPage < 2.0, `Wheel page mode scroll should zoom out: got ${zoomPage}`);
    });

    it('4.5 should handle double-click zoom (dblclick event) and zoom control buttons', () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, { width: 800, height: 600 });
      const vp = new ViewportController(proj, null, { width: 800, height: 600 });
      const mockContainer = createMockElement(800, 600);
      const mockZoomIn = createMockElement(30, 30);
      const mockZoomOut = createMockElement(30, 30);

      vp.attachEventListeners(mockContainer, mockZoomIn, mockZoomOut);

      vp.zoom = 2.0;
      const initialGeoDbl = proj.screenToGeo(450, 350, vp.getState());

      // Double Click at (450, 350)
      mockContainer.dispatchMockEvent('dblclick', { clientX: 450, clientY: 350 });
      assert.equal(vp.zoom, 3.0, `Double click should increase zoom 1.5x from 2.0 to 3.0, got ${vp.zoom}`);

      const geoAfterDbl = proj.screenToGeo(450, 350, vp.getState());
      assert.ok(Math.abs(geoAfterDbl.lat - initialGeoDbl.lat) < 1e-6);
      assert.ok(Math.abs(geoAfterDbl.lng - initialGeoDbl.lng) < 1e-6);

      // Zoom In Button click
      mockZoomIn.dispatchMockEvent('click', {});
      assert.equal(vp.zoom, 3.75, `Zoom in button should increase zoom by 1.25x from 3.0 to 3.75, got ${vp.zoom}`);

      // Zoom Out Button click
      mockZoomOut.dispatchMockEvent('click', {});
      assert.equal(vp.zoom, 3.0, `Zoom out button should decrease zoom by 0.8x from 3.75 to 3.0, got ${vp.zoom}`);
    });
  });
});
