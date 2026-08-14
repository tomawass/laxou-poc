/**
 * Unit Test Suite for Milestone 3 — Interactive Marker Overlay & Sidebar Controller
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../js/eventBus.js';
import { Projection } from '../js/projection.js';
import { DataProvider } from '../js/dataProvider.js';
import { ViewportController } from '../js/viewport.js';
import { MarkerManager } from '../js/markerManager.js';
import { SidebarController } from '../js/sidebarController.js';

// Mock minimal DOM environment for Node.js
function setupMockDOM() {
  class MockClassList {
    constructor() {
      this.set = new Set();
    }
    add(cls) { this.set.add(cls); }
    remove(cls) { this.set.delete(cls); }
    has(cls) { return this.set.has(cls); }
    toggle(cls, force) {
      if (force === undefined) {
        if (this.set.has(cls)) this.set.delete(cls);
        else this.set.add(cls);
      } else if (force) {
        this.set.add(cls);
      } else {
        this.set.delete(cls);
      }
    }
  }

  class MockElement {
    constructor(tagName = 'div') {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.classList = new MockClassList();
      this.style = {};
      this.dataset = {};
      this.attributes = new Map();
      this.listeners = new Map();
      this.innerHTML = '';
      this.textContent = '';
    }

    appendChild(child) {
      this.children.push(child);
      return child;
    }

    remove() {}

    setAttribute(key, val) {
      this.attributes.set(key, val);
    }

    getAttribute(key) {
      return this.attributes.get(key) || null;
    }

    addEventListener(event, fn) {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set());
      this.listeners.get(event).add(fn);
    }

    dispatchEvent(event) {
      const type = typeof event === 'string' ? event : event.type;
      if (this.listeners.has(type)) {
        for (const fn of this.listeners.get(type)) fn(event);
      }
    }

    querySelector() { return null; }
    querySelectorAll() { return []; }
    scrollIntoView() {}
  }

  return {
    overlayEl: new MockElement('div'),
    sidebar: new MockElement('aside'),
    placesList: new MockElement('div'),
    detailDrawer: new MockElement('div'),
    drawerContent: new MockElement('div'),
    closeDrawerBtn: new MockElement('button'),
    resultsCount: new MockElement('span'),
    placesBadge: new MockElement('span'),
    createElement: (tag) => new MockElement(tag)
  };
}

test('Milestone 3 — MarkerManager Component', async (t) => {
  const dom = setupMockDOM();
  const eventBus = new EventBus();
  const dataProvider = new DataProvider(eventBus);
  await dataProvider.loadData('./data.json');

  const projection = new Projection(Projection.DEFAULT_BOUNDS, { width: 800, height: 600 });
  const viewport = new ViewportController(projection, eventBus, { width: 800, height: 600 });

  globalThis.document = {
    createElement: dom.createElement,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const markerManager = new MarkerManager(
    dom.overlayEl,
    projection,
    viewport,
    eventBus,
    dataProvider
  );

  await t.test('should render DOM markers for all places in data.json', () => {
    const places = dataProvider.getPlaces();
    markerManager.renderMarkers(places);

    assert.equal(markerManager.markerElements.size, 211);
    assert.equal(dom.overlayEl.children.length, 211);
  });

  await t.test('should update marker positions on viewport:changed event', () => {
    let callCount = 0;
    const origUpdate = markerManager.updatePositions.bind(markerManager);
    markerManager.updatePositions = (vpState) => {
      callCount++;
      return origUpdate(vpState);
    };

    eventBus.emit('viewport:changed', viewport.getState());
    assert.ok(callCount > 0, 'updatePositions should be triggered by viewport:changed');
  });

  await t.test('should activate correct marker when place:selected is emitted', () => {
    eventBus.emit('place:selected', { placeId: 'mairie-laxou' });
    assert.equal(markerManager.activeMarkerId, 'mairie-laxou');

    const el = markerManager.getMarkerElement('mairie-laxou');
    assert.ok(el.classList.has('active'));
  });

  await t.test('should filter marker visibility with setVisiblePlaces()', () => {
    markerManager.setVisiblePlaces(['mairie-laxou', 'parc-boufflers']);
    assert.equal(markerManager.visibleIds.size, 2);
    assert.ok(markerManager.visibleIds.has('mairie-laxou'));
    assert.ok(!markerManager.visibleIds.has('cilm-champ-le-boeuf'));
  });
});

test('Milestone 3 — SidebarController Component', async (t) => {
  const dom = setupMockDOM();
  const eventBus = new EventBus();
  const dataProvider = new DataProvider(eventBus);
  await dataProvider.loadData('./data.json');

  globalThis.document = {
    createElement: dom.createElement,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const sidebarController = new SidebarController(eventBus, dataProvider, dom);

  await t.test('should render places list in sidebar and update badges', () => {
    const places = dataProvider.getPlaces();
    sidebarController.renderPlacesList(places);

    assert.equal(dom.placesList.children.length, 211);
    assert.equal(dom.placesBadge.textContent, 211);
    assert.ok(dom.resultsCount.textContent.includes('211 lieux'));
  });

  await t.test('should show detail drawer when a place is selected', () => {
    const place = dataProvider.getPlaceById('mairie-laxou');
    sidebarController.showDetailDrawer(place);

    assert.ok(!dom.detailDrawer.classList.has('hidden'));
    assert.ok(dom.drawerContent.innerHTML.includes('Hôtel de Ville de Laxou'));
    assert.ok(dom.drawerContent.innerHTML.includes('3 Avenue Paul Déroulède'));
  });

  await t.test('should hide detail drawer when hideDetailDrawer() is called', () => {
    sidebarController.hideDetailDrawer();
    assert.ok(dom.detailDrawer.classList.has('hidden'));
  });
});
