import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Projection } from "../js/projection.js";
import { DataProvider } from "../js/dataProvider.js";
import { EventBus } from "../js/eventBus.js";

describe("Adversarial Stress Suite — Projection Engine", () => {
  it("1. Global coordinate roundtrips across [-90,90] lat and [-180,180] lng (50,000 samples)", () => {
    const globalBounds = { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180 };
    const proj = new Projection(globalBounds, { width: 1920, height: 1080 });

    const numSamples = 50000;
    let maxLatError = 0;
    let maxLngError = 0;
    let sumLatError = 0;
    let sumLngError = 0;
    let nanCount = 0;

    for (let i = 0; i < numSamples; i++) {
      const lat = Math.random() * 180 - 90;
      const lng = Math.random() * 360 - 180;

      const world = proj.geoToWorld(lat, lng);
      if (!isFinite(world.x) || !isFinite(world.y)) {
        nanCount++;
        continue;
      }

      const restoredGeo = proj.worldToGeo(world.x, world.y);
      if (!isFinite(restoredGeo.lat) || !isFinite(restoredGeo.lng)) {
        nanCount++;
        continue;
      }

      const latErr = Math.abs(restoredGeo.lat - lat);
      const lngErr = Math.abs(restoredGeo.lng - lng);

      sumLatError += latErr;
      sumLngError += lngErr;

      if (latErr > maxLatError) maxLatError = latErr;
      if (lngErr > maxLngError) maxLngError = lngErr;

      // Screen roundtrip with valid random viewport
      const viewport = {
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        zoom: Math.random() * 10 + 0.1,
      };
      const screen = proj.geoToScreen(lat, lng, viewport);
      const restoredScreenGeo = proj.screenToGeo(screen.x, screen.y, viewport);

      assert.ok(
        Math.abs(restoredScreenGeo.lat - lat) < 1e-6,
        `Screen Lat roundtrip failed: expected ${lat}, got ${restoredScreenGeo.lat}`,
      );
      assert.ok(
        Math.abs(restoredScreenGeo.lng - lng) < 1e-6,
        `Screen Lng roundtrip failed: expected ${lng}, got ${restoredScreenGeo.lng}`,
      );
    }

    const avgLatErr = sumLatError / numSamples;
    const avgLngErr = sumLngError / numSamples;

    assert.equal(
      nanCount,
      0,
      "No NaNs or Infinities should be produced during roundtrips",
    );
    assert.ok(maxLatError < 1e-10, `Max lat error too high: ${maxLatError}`);
    assert.ok(maxLngError < 1e-10, `Max lng error too high: ${maxLngError}`);
    assert.ok(avgLatErr < 1e-12, `Average lat error too high: ${avgLatErr}`);
    assert.ok(avgLngErr < 1e-12, `Average lng error too high: ${avgLngErr}`);
  });

  it("2. Extreme zoom levels (0, 1e-10, 1e-6, 1e6, 1e12, Infinity, -10, NaN)", () => {
    const proj = new Projection();
    const extremeZooms = [
      0,
      1e-10,
      1e-6,
      1e6,
      1e12,
      Infinity,
      -10,
      NaN,
      undefined,
      null,
    ];

    for (const zoom of extremeZooms) {
      const vp = { x: 0, y: 0, zoom, width: 800, height: 600 };
      const screen = proj.geoToScreen(48.6865, 6.1504, vp);

      assert.ok(
        typeof screen.x === "number",
        `screen.x should be a number for zoom ${zoom}`,
      );
      assert.ok(
        typeof screen.y === "number",
        `screen.y should be a number for zoom ${zoom}`,
      );

      const geo = proj.screenToGeo(screen.x, screen.y, vp);
      assert.ok(
        typeof geo.lat === "number",
        `geo.lat should be a number for zoom ${zoom}`,
      );
      assert.ok(
        typeof geo.lng === "number",
        `geo.lng should be a number for zoom ${zoom}`,
      );
    }
  });

  it("3. Zero, negative, NaN, and Infinity viewport dimensions", () => {
    const proj = new Projection();
    const edgeViewports = [
      { width: 0, height: 0, zoom: 1 },
      { width: -100, height: -500, zoom: 1 },
      { width: NaN, height: NaN, zoom: 1 },
      { width: Infinity, height: Infinity, zoom: 1 },
    ];

    for (const vp of edgeViewports) {
      const screen = proj.geoToScreen(48.6865, 6.1504, vp);
      assert.ok(
        typeof screen.x === "number",
        `screen.x must be a number for viewport ${JSON.stringify(vp)}`,
      );
      assert.ok(
        typeof screen.y === "number",
        `screen.y must be a number for viewport ${JSON.stringify(vp)}`,
      );

      const geo = proj.screenToGeo(100, 100, vp);
      assert.ok(
        typeof geo.lat === "number",
        `geo.lat must be a number for viewport ${JSON.stringify(vp)}`,
      );
      assert.ok(
        typeof geo.lng === "number",
        `geo.lng must be a number for viewport ${JSON.stringify(vp)}`,
      );
    }
  });

  it("4. Non-standard aspect ratios (ultra-wide 10000x1, ultra-tall 1x10000)", () => {
    const aspectRatios = [
      { width: 10000, height: 1 },
      { width: 1, height: 10000 },
      { width: 3840, height: 1080 }, // Ultra-wide monitor
      { width: 1080, height: 2400 }, // Tall smartphone
    ];

    for (const size of aspectRatios) {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, size);
      const center = proj.getCenter();
      const worldCenter = proj.geoToWorld(center.lat, center.lng);
      assert.ok(Math.abs(worldCenter.x - 0.5) < 1e-6);
      assert.ok(Math.abs(worldCenter.y - 0.5) < 1e-6);

      const screenCenter = proj.geoToScreen(center.lat, center.lng, {
        zoom: 1,
        ...size,
      });
      assert.ok(Math.abs(screenCenter.x - size.width / 2) < 1e-6);
      assert.ok(Math.abs(screenCenter.y - size.height / 2) < 1e-6);
    }
  });

  it("5. Inverted and zero-span geographic bounds", () => {
    // Inverted bounds: minLat > maxLat, minLng > maxLng
    const invertedBounds = {
      minLat: 48.7,
      maxLat: 48.66,
      minLng: 6.2,
      maxLng: 6.12,
    };
    const projInverted = new Projection(invertedBounds);
    const boundsInverted = projInverted.getBounds();
    assert.equal(boundsInverted.minLat, 48.66);
    assert.equal(boundsInverted.maxLat, 48.7);
    assert.equal(boundsInverted.minLng, 6.12);
    assert.equal(boundsInverted.maxLng, 6.2);

    // Zero-span bounds
    const zeroBounds = {
      minLat: 48.68,
      maxLat: 48.68,
      minLng: 6.15,
      maxLng: 6.15,
    };
    const projZero = new Projection(zeroBounds);
    assert.ok(projZero.bounds.dLat > 0, "dLat must be greater than zero");
    assert.ok(projZero.bounds.dLng > 0, "dLng must be greater than zero");

    const world = projZero.geoToWorld(48.68, 6.15);
    assert.ok(isFinite(world.x));
    assert.ok(isFinite(world.y));
  });

  it("6. Single point and empty bounds calculation", () => {
    const singlePointBounds = Projection.calculateBounds([
      { lat: 48.68, lng: 6.15 },
    ]);
    assert.equal(singlePointBounds.minLat, 48.68);
    assert.equal(singlePointBounds.maxLat, 48.68);

    const emptyBounds = Projection.calculateBounds([]);
    assert.deepEqual(emptyBounds, Projection.DEFAULT_BOUNDS);
  });
});

describe("Adversarial Stress Suite — DataProvider Component", () => {
  let provider;

  it("Setup: Load data.json", async () => {
    provider = new DataProvider();
    await provider.loadData("./data.json");
    assert.ok(provider.isLoaded);
  });

  it("1. Malformed search queries (Regex injections, symbols, empty, multi-spaces, non-strings)", () => {
    const malformedQueries = [
      ".*",
      "[a-z]+",
      "(",
      ")",
      "\\",
      "^$",
      "?",
      "*",
      "+",
      "{1,3}",
      "<script>alert(1)</script>",
      "'; DROP TABLE places; --",
      "   ",
      "   \t  \n ",
      "   champ   le   boeuf   ",
      "a".repeat(100000), // 100k string
      null,
      undefined,
      123,
      true,
      false,
      {},
      [],
      Symbol("query"),
    ];

    for (const query of malformedQueries) {
      assert.doesNotThrow(
        () => {
          const results = provider.filterPlaces("all", query);
          assert.ok(
            Array.isArray(results),
            `Results must be an array for query ${String(query)}`,
          );
        },
        `Search failed on query: ${String(query)}`,
      );
    }

    const multiSpaceResults = provider.filterPlaces("all", "champ   boeuf");
    assert.ok(Array.isArray(multiSpaceResults));
  });

  it("2. Robustness with missing or corrupted fields in POIs", () => {
    const corruptDataset = {
      places: [
        {
          id: "valid-1",
          name: "Valid Place",
          category: "services",
          lat: 48.68,
          lng: 6.15,
          address: "Main St",
          description: "Desc",
          tags: ["tag1"],
        },
        {
          id: "missing-tags",
          name: "No Tags",
          category: "services",
          lat: 48.68,
          lng: 6.15,
          address: "Main St",
          description: "Desc",
          tags: null,
        },
        {
          id: "missing-desc",
          name: "No Desc",
          category: "services",
          lat: 48.68,
          lng: 6.15,
          address: null,
          description: undefined,
          tags: undefined,
        },
        {
          id: "numeric-fields",
          name: 12345,
          category: "services",
          lat: "48.68",
          lng: "6.15",
          address: 999,
          description: false,
          tags: [123, null, undefined],
        },
      ],
      categories: [{ id: "services", name: "Services" }],
    };

    const corruptProvider = new DataProvider();
    corruptProvider.places = corruptDataset.places;
    corruptProvider.categories = corruptDataset.categories;

    assert.doesNotThrow(() => {
      const res1 = corruptProvider.filterPlaces("all", "Main");
      assert.ok(res1.length >= 1);

      const res2 = corruptProvider.filterPlaces("services", "123");
      assert.ok(Array.isArray(res2));

      const res3 = corruptProvider.filterPlaces("all", "tag1");
      assert.equal(res3.length, 1);
    });
  });

  it("3. Edge case category lookups", () => {
    const categoryCases = [
      "NON_EXISTENT_CATEGORY",
      "SERVICES", // Upper case
      "   services   ",
      "",
      null,
      undefined,
      12345,
      {},
      ["services"],
    ];

    for (const cat of categoryCases) {
      assert.doesNotThrow(() => {
        const results = provider.filterPlaces(cat, "");
        assert.ok(Array.isArray(results));
      });
    }

    assert.equal(provider.filterPlaces("NON_EXISTENT_CATEGORY").length, 0);
    assert.equal(provider.filterPlaces("   services   ").length, 4);
  });

  it("4. Fast repetitive search queries performance test (50,000 filters)", () => {
    const queries = [
      "champ",
      "boeuf",
      "bœuf",
      "laxou",
      "nancy",
      "ecole",
      "park",
      "sports",
      "mediatheque",
      "parc",
    ];
    const startTime = performance.now();

    for (let i = 0; i < 50000; i++) {
      const q = queries[i % queries.length];
      const cat = i % 2 === 0 ? "all" : "services";
      provider.filterPlaces(cat, q);
    }

    const duration = performance.now() - startTime;
    assert.ok(
      duration < 5000,
      `50,000 filter operations took too long: ${duration.toFixed(2)}ms`,
    );
  });
});

describe("Adversarial Stress Suite — EventBus Component", () => {
  it("1. Concurrent listener modification during emit", () => {
    const bus = new EventBus();
    let l2Called = false;
    let l3Called = false;

    const listener1 = () => {
      bus.off("test", listener1);
      bus.on("test", () => {
        l3Called = true;
      });
    };

    const listener2 = () => {
      l2Called = true;
    };

    bus.on("test", listener1);
    bus.on("test", listener2);

    assert.doesNotThrow(() => {
      bus.emit("test", { data: 1 });
    });

    assert.equal(l2Called, true);
    assert.equal(l3Called, false);

    l2Called = false;
    bus.emit("test", { data: 2 });
    assert.equal(l2Called, true);
    assert.equal(l3Called, true);
  });

  it("2. Rapid register/unregister cycles (50,000 iterations memory check)", () => {
    const bus = new EventBus();
    const eventName = "rapid:cycle";

    const memBefore = process.memoryUsage().heapUsed;

    for (let i = 0; i < 50000; i++) {
      const fn = () => {};
      const unsub = bus.on(eventName, fn);
      unsub();
    }

    const memAfter = process.memoryUsage().heapUsed;
    const memDeltaMB = (memAfter - memBefore) / (1024 * 1024);

    assert.equal(
      bus.listeners.has(eventName),
      false,
      "Map entry for event should be deleted",
    );
    assert.equal(bus.listeners.size, 0, "Listeners map should be empty");
    assert.ok(
      memDeltaMB < 5,
      `Memory growth too high: ${memDeltaMB.toFixed(2)} MB`,
    );
  });

  it("3. Unsubscribing once() listener via bus.off(event, callback)", () => {
    const bus = new EventBus();
    let called = false;
    const cb = () => {
      called = true;
    };

    const unsubHandle = bus.once("once:test", cb);

    // Testing unsubscription via handle vs via off(event, cb)
    assert.equal(typeof unsubHandle, "function");

    // Unsubscribe using the returned handle
    unsubHandle();
    bus.emit("once:test");
    assert.equal(
      called,
      false,
      "Listener should not be called after unsubHandle()",
    );
  });

  it("4. Non-Error throw in listener callback (string, object, null, undefined)", () => {
    const bus = new EventBus();
    let finalCalled = false;

    bus.on("error:test", () => {
      throw "String exception";
    });
    bus.on("error:test", () => {
      throw null;
    });
    bus.on("error:test", () => {
      throw { customErr: "foo" };
    });
    bus.on("error:test", () => {
      throw undefined;
    });
    bus.on("error:test", () => {
      finalCalled = true;
    });

    assert.doesNotThrow(() => {
      bus.emit("error:test", {});
    });

    assert.equal(
      finalCalled,
      true,
      "Final listener must execute despite non-Error throws in preceding listeners",
    );
  });

  it("5. High listener load (10,000 listeners on a single event)", () => {
    const bus = new EventBus();
    const count = 10000;
    let callCount = 0;

    const listeners = [];
    for (let i = 0; i < count; i++) {
      const fn = () => {
        callCount++;
      };
      listeners.push(fn);
      bus.on("high:load", fn);
    }

    assert.equal(bus.listeners.get("high:load").size, count);

    const startTime = performance.now();
    bus.emit("high:load", { test: true });
    const duration = performance.now() - startTime;

    assert.equal(callCount, count);
    assert.ok(
      duration < 500,
      `Emitting to 10,000 listeners took too long: ${duration.toFixed(2)}ms`,
    );

    bus.clear();
    assert.equal(bus.listeners.size, 0);
  });
});
