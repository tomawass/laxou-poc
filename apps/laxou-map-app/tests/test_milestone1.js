import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EventBus } from "../js/eventBus.js";
import { Projection } from "../js/projection.js";
import { DataProvider } from "../js/dataProvider.js";

describe("Milestone 1 — EventBus Component", () => {
  it("should register subscribers and emit events with payload", () => {
    const bus = new EventBus();
    let received = null;

    bus.on("test:event", (payload) => {
      received = payload;
    });

    bus.emit("test:event", { foo: "bar", value: 42 });
    assert.deepEqual(received, { foo: "bar", value: 42 });
  });

  it("should return an unsubscribe function from on()", () => {
    const bus = new EventBus();
    let count = 0;

    const unsubscribe = bus.on("counter", () => {
      count++;
    });

    bus.emit("counter");
    assert.equal(count, 1);

    unsubscribe();
    bus.emit("counter");
    assert.equal(count, 1);
  });

  it("should remove specific listener or all listeners with off()", () => {
    const bus = new EventBus();
    let fn1Count = 0;
    let fn2Count = 0;

    const fn1 = () => {
      fn1Count++;
    };
    const fn2 = () => {
      fn2Count++;
    };

    bus.on("multi", fn1);
    bus.on("multi", fn2);

    bus.emit("multi");
    assert.equal(fn1Count, 1);
    assert.equal(fn2Count, 1);

    bus.off("multi", fn1);
    bus.emit("multi");
    assert.equal(fn1Count, 1);
    assert.equal(fn2Count, 2);

    bus.off("multi");
    bus.emit("multi");
    assert.equal(fn1Count, 1);
    assert.equal(fn2Count, 2);
  });

  it("should support once() for single execution", () => {
    const bus = new EventBus();
    let count = 0;

    bus.once("single", () => {
      count++;
    });

    bus.emit("single");
    bus.emit("single");
    bus.emit("single");

    assert.equal(count, 1);
  });

  it("should isolate callback errors during emit() without breaking other listeners", () => {
    const bus = new EventBus();
    let fn2Called = false;

    bus.on("error:test", () => {
      throw new Error("Listener failure simulation");
    });

    bus.on("error:test", () => {
      fn2Called = true;
    });

    // Should not throw, and fn2 should execute
    bus.emit("error:test", { data: 1 });
    assert.equal(fn2Called, true);
  });

  it("should clear all listeners with clear()", () => {
    const bus = new EventBus();
    let called = false;

    bus.on("ev1", () => {
      called = true;
    });
    bus.on("ev2", () => {
      called = true;
    });

    bus.clear();
    bus.emit("ev1");
    bus.emit("ev2");

    assert.equal(called, false);
  });
});

describe("Milestone 1 — Projection Engine", () => {
  it("should correctly project center of default Laxou bounds to (0.5, 0.5) world coords", () => {
    const proj = new Projection();
    const bounds = proj.getBounds();
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;

    const world = proj.geoToWorld(centerLat, centerLng);
    assert.ok(Math.abs(world.x - 0.5) < 1e-7);
    assert.ok(Math.abs(world.y - 0.5) < 1e-7);
  });

  it("should compute correct cosine latitude scaling factor for Laxou (~0.66018)", () => {
    const proj = new Projection();
    const centerLatRad = (48.6865 * Math.PI) / 180;
    const expectedCos = Math.cos(centerLatRad);

    assert.ok(Math.abs(proj.cosRefLat - expectedCos) < 1e-5);
    assert.ok(proj.cosRefLat > 0.65 && proj.cosRefLat < 0.67);
  });

  it("should preserve bidirectional roundtrip identity (geoToScreen -> screenToGeo)", () => {
    const proj = new Projection(Projection.DEFAULT_BOUNDS, {
      width: 1024,
      height: 768,
    });

    const viewports = [
      { x: 0, y: 0, zoom: 1, width: 1024, height: 768 },
      { x: 150, y: -80, zoom: 2.5, width: 1024, height: 768 },
      { panX: -200, panY: 300, zoom: 4.0, width: 1024, height: 768 },
    ];

    const testCoords = [
      { lat: 48.6865, lng: 6.1504 }, // Laxou center
      { lat: 48.6975, lng: 6.1425 }, // CILM Champ-le-Bœuf
      { lat: 48.6936, lng: 6.1832 }, // Place Stanislas Nancy
      { lat: 48.679, lng: 6.1688 }, // Nancy Thermal
    ];

    for (const vp of viewports) {
      for (const coord of testCoords) {
        const screen = proj.geoToScreen(coord.lat, coord.lng, vp);
        const restoredGeo = proj.screenToGeo(screen.x, screen.y, vp);

        assert.ok(
          Math.abs(restoredGeo.lat - coord.lat) < 1e-9,
          `Lat roundtrip failed for ${coord.lat}`,
        );
        assert.ok(
          Math.abs(restoredGeo.lng - coord.lng) < 1e-9,
          `Lng roundtrip failed for ${coord.lng}`,
        );
      }
    }
  });

  it("should handle zero-span bounds defensively without throwing NaN", () => {
    const zeroBounds = {
      minLat: 48.68,
      maxLat: 48.68,
      minLng: 6.15,
      maxLng: 6.15,
    };
    const proj = new Projection(zeroBounds);

    const world = proj.geoToWorld(48.68, 6.15);
    assert.ok(isFinite(world.x));
    assert.ok(isFinite(world.y));

    const screen = proj.geoToScreen(48.68, 6.15);
    assert.ok(isFinite(screen.x));
    assert.ok(isFinite(screen.y));
  });

  it("should handle invalid lat/lng inputs gracefully", () => {
    const proj = new Projection();
    const invalidWorld = proj.geoToWorld("invalid", null);
    assert.deepEqual(invalidWorld, { x: 0.5, y: 0.5 });

    const invalidScreen = proj.worldToScreen(NaN, undefined);
    assert.deepEqual(invalidScreen, { x: 0, y: 0 });
  });

  it("should verify isPointInBounds helper", () => {
    const proj = new Projection();
    assert.equal(proj.isPointInBounds(48.6865, 6.1504), true);
    assert.equal(proj.isPointInBounds(40.0, 2.0), false);
  });
});

describe("Milestone 1 — Data Model & data.json Integrity", () => {
  it("should load data.json and verify POIs across 5 categories", async () => {
    const provider = new DataProvider();
    const data = await provider.loadData("./data.json");

    assert.ok(data);
    assert.equal(provider.getPlaces().length, 211);
    assert.equal(provider.getCategories().length, 5);

    const categories = provider.getCategories();
    const categoryIds = categories.map((c) => c.id).sort();
    assert.deepEqual(categoryIds, [
      "culture",
      "ecoles",
      "parcs",
      "services",
      "sports",
    ]);
  });

  it("should verify that all POIs contain required schema fields", async () => {
    const provider = new DataProvider();
    await provider.loadData("./data.json");
    const places = provider.getPlaces();

    const requiredFields = [
      "id",
      "name",
      "category",
      "lat",
      "lng",
      "address",
      "description",
      "image",
      "tags",
      "link",
    ];

    for (const place of places) {
      for (const field of requiredFields) {
        assert.ok(
          place[field] !== undefined && place[field] !== null,
          `POI "${place.id}" missing field "${field}"`,
        );
      }
      assert.ok(
        Array.isArray(place.tags),
        `POI "${place.id}" tags must be an array`,
      );
      assert.ok(
        isFinite(place.lat) && isFinite(place.lng),
        `POI "${place.id}" lat/lng must be numeric`,
      );
    }
  });

  it("should verify that NPRNU locations exist in Laxou (Champ-le-Bœuf & Provinces)", async () => {
    const provider = new DataProvider();
    await provider.loadData("./data.json");
    const places = provider.getPlaces();

    const nprnuPlaces = places.filter(
      (p) => p.isNprnu === true || p.tags.includes("NPRNU"),
    );
    assert.ok(nprnuPlaces.length >= 5);

    const nprnuIds = nprnuPlaces.map((p) => p.id);
    assert.ok(nprnuIds.includes("centre-social-champ-le-boeuf"));
    assert.ok(nprnuIds.includes("cilm-champ-le-boeuf"));
    assert.ok(nprnuIds.includes("ecole-champ-le-boeuf"));
    assert.ok(nprnuIds.includes("gymnase-champ-le-boeuf"));
    assert.ok(nprnuIds.includes("parc-urbain-provinces"));
  });
});

describe("Milestone 1 — DataProvider Filtering & Accent-Insensitive Search", () => {
  let provider;

  it("should load data and emit event on EventBus", async () => {
    const bus = new EventBus();
    let eventData = null;

    bus.on("data:loaded", (payload) => {
      eventData = payload;
    });

    provider = new DataProvider(bus);
    await provider.loadData("./data.json");

    assert.ok(eventData);
    assert.equal(eventData.placesCount, 211);
    assert.equal(eventData.categoriesCount, 5);
  });

  it("should lookup POI by ID correctly", () => {
    const place = provider.getPlaceById("mairie-laxou");
    assert.ok(place);
    assert.equal(place.name, "Hôtel de Ville de Laxou");
    assert.equal(provider.getPlaceById("non-existent-id"), null);
  });

  it("should filter places by category ID", () => {
    const services = provider.filterPlaces("services");
    assert.ok(services.length >= 4);

    const parcs = provider.filterPlaces("parcs");
    assert.ok(parcs.length >= 4);

    const culture = provider.filterPlaces("culture");
    assert.ok(culture.length >= 4);

    const sports = provider.filterPlaces("sports");
    assert.ok(sports.length >= 3);

    const ecoles = provider.filterPlaces("ecoles");
    assert.ok(ecoles.length >= 3);

    const all = provider.filterPlaces("all");
    assert.equal(all.length, 211);
  });

  it('should perform accent-insensitive search (e.g. "ecole", "boeuf", "bœuf", "mediatheque", "cedre")', () => {
    // Search "ecole" without accent should match "Écoles", "Groupe Scolaire", etc.
    const ecoleResults = provider.filterPlaces("all", "ecole");
    assert.ok(ecoleResults.length >= 3);
    assert.ok(ecoleResults.some((p) => p.id === "ecole-champ-le-boeuf"));

    // Search "boeuf" (without ligature) or "bœuf" (with ligature) should match "Champ-le-Bœuf"
    const boeufResults = provider.filterPlaces("all", "boeuf");
    assert.ok(boeufResults.length >= 4);

    const ligResults = provider.filterPlaces("all", "bœuf");
    assert.ok(ligResults.length >= 4);

    // Search "mediatheque" without accent should match "Médiathèque Gérard Thirion"
    const mediathequeResults = provider.filterPlaces("all", "mediatheque");
    assert.ok(mediathequeResults.length >= 1);
    assert.ok(mediathequeResults.some((p) => p.id === "mediatheque-thirion"));

    // Search "cedre" without accent should match "Tour Cèdre" in tags/description
    const cedreResults = provider.filterPlaces("all", "cedre");
    assert.ok(cedreResults.length >= 1);
    assert.ok(cedreResults.some((p) => p.id === "ecole-champ-le-boeuf"));
  });

  it("should search across multiple fields (name, description, address, tags)", () => {
    // Search in name: "Mairie"
    const nameMatch = provider.filterPlaces("all", "Mairie");
    assert.ok(nameMatch.some((p) => p.id === "mairie-laxou"));

    // Search in address: "Deroulede"
    const addressMatch = provider.filterPlaces("all", "Deroulede");
    assert.ok(addressMatch.length >= 1);
    assert.ok(addressMatch.some((p) => p.id === "mairie-laxou"));

    // Search in tags: "NPRNU"
    const tagMatch = provider.filterPlaces("all", "NPRNU");
    assert.ok(tagMatch.length >= 5);

    // Search in description: "Art Deco"
    const descMatch = provider.filterPlaces("all", "Art Deco");
    assert.ok(descMatch.length >= 1);
    assert.ok(descMatch.some((p) => p.id === "museum-aquarium-nancy"));
  });

  it("should combine category filter and search query", () => {
    // Category sports + search "Champ"
    const combined = provider.filterPlaces("sports", "Champ");
    assert.ok(combined.length >= 1);
    assert.ok(combined.some((p) => p.id === "gymnase-champ-le-boeuf"));
  });

  it("should throw an error when loading invalid dataset schema", () => {
    const invalidProvider = new DataProvider();

    assert.throws(() => {
      invalidProvider.validateSchema({ invalid: true });
    }, /places/);

    assert.throws(() => {
      invalidProvider.validateSchema({
        places: "not-an-array",
        categories: [],
      });
    }, /places/);

    assert.throws(() => {
      invalidProvider.validateSchema({
        places: [{ id: "p1", name: "Test" }], // Missing category and lat/lng
        categories: [],
      });
    }, /category/);
  });
});
