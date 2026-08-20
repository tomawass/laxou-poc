import test from "node:test";
import assert from "node:assert/strict";

import { EventBus } from "../js/eventBus.js";
import { DataProvider } from "../js/dataProvider.js";
import { ImageMapEngine } from "../js/imageMapEngine.js";

test("NPRNU Map — Dataset Integrity", async (t) => {
  const provider = new DataProvider();
  const data = await provider.loadData("./data.json");

  assert.ok(data);
  assert.equal(provider.getPlaces().length, 12);
  assert.equal(provider.getCategories().length, 5);

  const places = provider.getPlaces();
  for (const place of places) {
    assert.ok(place.id);
    assert.ok(place.name);
    assert.ok(place.category);
    assert.ok(isFinite(place.x) && place.x >= 0 && place.x <= 100);
    assert.ok(isFinite(place.y) && place.y >= 0 && place.y <= 100);
  }
});

test("NPRNU Map — ImageMapEngine Coordinates Projection", async (t) => {
  const eventBus = new EventBus();
  const mockContainer = {
    clientWidth: 1000,
    clientHeight: 600,
    getBoundingClientRect: () => ({
      width: 1000,
      height: 600,
      left: 0,
      top: 0,
    }),
    addEventListener: () => {},
    style: {},
  };
  const mockImageContainer = { style: {} };

  const engine = new ImageMapEngine(
    mockContainer,
    mockImageContainer,
    eventBus,
  );

  const posCenter = engine.geoToScreen(50, 50);
  assert.equal(posCenter.x, 500);
  assert.equal(posCenter.y, 300);

  engine.centerOnPct(25, 25, 2.0);
  assert.equal(engine.zoom, 2.0);
});

test("NPRNU Map — DataProvider Filtering & Search", async (t) => {
  const provider = new DataProvider();
  await provider.loadData("./data.json");

  const ecoles = provider.filterPlaces("ecoles");
  assert.ok(ecoles.length >= 3);

  const zola = provider.filterPlaces("all", "zola");
  assert.equal(zola.length, 1);
  assert.equal(zola[0].id, "ecole-emile-zola");
});
