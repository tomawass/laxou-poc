import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DataProvider } from '../js/dataProvider.js';
import { Projection } from '../js/projection.js';

describe('Adversarial Stress Test — Challenger 2 (Milestone 1)', () => {

  // =========================================================================
  // 1. DATA.JSON SCHEMA & DOMAIN INTEGRITY
  // =========================================================================
  describe('1. data.json Schema & Domain Integrity', () => {
    let dataProvider;
    let data;

    it('should load data.json and verify root metadata & structure', async () => {
      dataProvider = new DataProvider();
      data = await dataProvider.loadData('./data.json');

      assert.ok(data, 'Loaded data object should exist');
      assert.ok(data.metadata, 'Metadata object must exist');
      assert.equal(data.metadata.city, 'Laxou');
      assert.equal(data.metadata.postalCode, '54520');
      assert.equal(data.places.length, 18, 'Must contain exactly 18 POIs');
      assert.equal(data.categories.length, 5, 'Must contain exactly 5 categories');
    });

    it('should verify all 18 POIs are strictly within Laxou/Nancy bounding box [48.6750, 6.1350] to [48.7020, 6.1950]', () => {
      const minLat = 48.6750;
      const maxLat = 48.7020;
      const minLng = 6.1350;
      const maxLng = 6.1950;

      data.places.forEach((place) => {
        assert.ok(
          place.lat >= minLat && place.lat <= maxLat,
          `POI "${place.name}" (${place.id}) lat ${place.lat} is outside bounding box [${minLat}, ${maxLat}]`
        );
        assert.ok(
          place.lng >= minLng && place.lng <= maxLng,
          `POI "${place.name}" (${place.id}) lng ${place.lng} is outside bounding box [${minLng}, ${maxLng}]`
        );
      });
    });

    it('should verify category ID integrity for all 18 POIs', () => {
      const validCategoryIds = new Set(data.categories.map((c) => c.id));
      assert.deepEqual(
        Array.from(validCategoryIds).sort(),
        ['culture', 'ecoles', 'parcs', 'services', 'sports'].sort()
      );

      data.places.forEach((place) => {
        assert.ok(
          validCategoryIds.has(place.category),
          `POI "${place.name}" (${place.id}) has invalid category "${place.category}"`
        );
      });
    });

    it('should verify non-empty descriptions, tags, names, images, and addresses', () => {
      data.places.forEach((place) => {
        assert.ok(typeof place.id === 'string' && place.id.trim().length > 0, `Place missing id`);
        assert.ok(typeof place.name === 'string' && place.name.trim().length > 0, `Place ${place.id} missing name`);
        assert.ok(typeof place.address === 'string' && place.address.trim().length > 0, `Place ${place.id} missing address`);
        assert.ok(typeof place.description === 'string' && place.description.trim().length >= 10, `Place ${place.id} description too short`);
        assert.ok(typeof place.image === 'string' && place.image.startsWith('http'), `Place ${place.id} missing valid image URL`);
        assert.ok(Array.isArray(place.tags) && place.tags.length >= 2, `Place ${place.id} tags array must have at least 2 elements`);
        
        place.tags.forEach((tag) => {
          assert.ok(typeof tag === 'string' && tag.trim().length > 0, `Place ${place.id} has empty tag element`);
        });
      });
    });

    it('should verify NPRNU Champ-le-Bœuf coverage (at least 4 NPRNU POIs in Champ-le-Bœuf)', () => {
      const nprnuPlaces = data.places.filter((p) => p.isNprnu === true);
      assert.ok(nprnuPlaces.length >= 5, `Expected at least 5 NPRNU POIs overall, found ${nprnuPlaces.length}`);

      const champLeBoeufNprnu = nprnuPlaces.filter((p) => {
        const text = `${p.name} ${p.description} ${p.address} ${(p.tags || []).join(' ')}`.toLowerCase();
        return text.includes('boeuf') || text.includes('bœuf');
      });

      assert.ok(
        champLeBoeufNprnu.length >= 4,
        `Expected at least 4 NPRNU POIs in Champ-le-Bœuf, found ${champLeBoeufNprnu.length}`
      );
    });
  });

  // =========================================================================
  // 2. DATAPROVIDER DIACRITICS, LIGATURES & SEARCH EDGE CASES
  // =========================================================================
  describe('2. DataProvider Diacritics & Ligatures Edge Cases', () => {
    let dp;

    beforeEach(async () => {
      dp = new DataProvider();
      await dp.loadData('./data.json');
    });

    it('should test ligature "oe" vs "œ" equivalence in search queries', () => {
      const query1 = dp.filterPlaces('all', 'boeuf');
      const query2 = dp.filterPlaces('all', 'bœuf');
      const query3 = dp.filterPlaces('all', 'BOEUF');
      const query4 = dp.filterPlaces('all', 'BŒUF');

      assert.ok(query1.length >= 4, `Query "boeuf" should return at least 4 POIs, got ${query1.length}`);
      assert.equal(query1.length, query2.length, '"boeuf" vs "bœuf" should return exact same count');
      assert.equal(query1.length, query3.length, '"boeuf" vs "BOEUF" should return exact same count');
      assert.equal(query1.length, query4.length, '"boeuf" vs "BŒUF" should return exact same count');

      const ids1 = query1.map((p) => p.id).sort();
      const ids2 = query2.map((p) => p.id).sort();
      assert.deepEqual(ids1, ids2, 'Matched POI IDs must be identical for "boeuf" and "bœuf"');
    });

    it('should test diacritics "e" vs "é/è/ê" and "a" vs "à/â"', () => {
      const queryEco1 = dp.filterPlaces('all', 'ecole');
      const queryEco2 = dp.filterPlaces('all', 'école');
      const queryEco3 = dp.filterPlaces('all', 'ÉCOLE');

      assert.ok(queryEco1.length >= 2, `Query "ecole" should match at least 2 items`);
      assert.equal(queryEco1.length, queryEco2.length, '"ecole" vs "école" match count mismatch');
      assert.equal(queryEco1.length, queryEco3.length, '"ecole" vs "ÉCOLE" match count mismatch');

      const queryMed1 = dp.filterPlaces('all', 'mediatheque');
      const queryMed2 = dp.filterPlaces('all', 'Médiathèque');
      assert.ok(queryMed1.length >= 1, 'Should find Médiathèque');
      assert.equal(queryMed1[0].id, queryMed2[0].id);

      const queryCed1 = dp.filterPlaces('all', 'cedre');
      const queryCed2 = dp.filterPlaces('all', 'Cèdre');
      assert.ok(queryCed1.length >= 1, 'Should find Tour Cèdre');
      assert.equal(queryCed1[0].id, queryCed2[0].id);
    });

    it('should test partial word match and address field searching', () => {
      // Partial substring matching
      const partial1 = dp.filterPlaces('all', 'thirion');
      assert.equal(partial1.length, 1);
      assert.equal(partial1[0].id, 'mediatheque-thirion');

      // Address field search
      const addressSearch1 = dp.filterPlaces('all', 'Stanislas');
      assert.ok(addressSearch1.length >= 2, 'Should find Hôtel de Ville & Opéra via Stanislas address');
      const stanislasIds = addressSearch1.map((p) => p.id);
      assert.ok(stanislasIds.includes('hotel-de-ville-nancy'));
      assert.ok(stanislasIds.includes('opera-national-lorraine'));

      // Street address search
      const addressSearch2 = dp.filterPlaces('all', 'Sergent Blandan');
      assert.equal(addressSearch2.length, 2, 'Should find Nancy Thermal and Lycée Chopin on Sergent Blandan');
    });

    it('should handle category filtering combined with search query', () => {
      const filtered1 = dp.filterPlaces('sports', 'boeuf');
      assert.equal(filtered1.length, 1);
      assert.equal(filtered1[0].id, 'gymnase-champ-le-boeuf');

      const filtered2 = dp.filterPlaces('ecoles', 'boeuf');
      assert.equal(filtered2.length, 1);
      assert.equal(filtered2[0].id, 'ecole-champ-le-boeuf');

      const filteredNone = dp.filterPlaces('culture', 'nonexistent_search_term_12345');
      assert.equal(filteredNone.length, 0);
    });

    it('should handle edge-case inputs gracefully without throwing exceptions', () => {
      assert.doesNotThrow(() => dp.filterPlaces(null, null));
      assert.doesNotThrow(() => dp.filterPlaces(undefined, undefined));
      assert.doesNotThrow(() => dp.filterPlaces(123, 456));
      assert.doesNotThrow(() => dp.filterPlaces('all', '   '));
      assert.doesNotThrow(() => dp.getPlaceById(null));
      assert.doesNotThrow(() => dp.getPlaceById(''));
      assert.equal(dp.getPlaceById('non-existent-id'), null);
    });
  });

  // =========================================================================
  // 3. PROJECTION MATH, LINEARITY, BOUNDS CLAMPING & METRIC DISTORTION
  // =========================================================================
  describe('3. Projection Math, Linearity & Metric Distortion', () => {

    it('should verify strict linearity of geoToWorld mapping', () => {
      const bounds = { minLat: 48.6750, maxLat: 48.7020, minLng: 6.1350, maxLng: 6.1950 };
      const proj = new Projection(bounds, { width: 800, height: 600 });

      // Check endpoints
      const nw = proj.geoToWorld(bounds.maxLat, bounds.minLng);
      assert.equal(nw.x, 0.0);
      assert.equal(nw.y, 0.0);

      const se = proj.geoToWorld(bounds.minLat, bounds.maxLng);
      assert.equal(se.x, 1.0);
      assert.equal(se.y, 1.0);

      const center = proj.geoToWorld((bounds.minLat + bounds.maxLat) / 2, (bounds.minLng + bounds.maxLng) / 2);
      assert.equal(center.x, 0.5);
      assert.equal(center.y, 0.5);

      // Linearity test across 50 points
      for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        const lat = bounds.minLat + t * (bounds.maxLat - bounds.minLat);
        const lng = bounds.minLng + t * (bounds.maxLng - bounds.minLng);

        const w = proj.geoToWorld(lat, lng);
        const expectedX = t;
        const expectedY = 1.0 - t;

        assert.ok(Math.abs(w.x - expectedX) < 1e-12, `x linearity failed at t=${t}`);
        assert.ok(Math.abs(w.y - expectedY) < 1e-12, `y linearity failed at t=${t}`);
      }
    });

    it('should verify screenToGeo and geoToScreen roundtrip identity across multi-scale viewports', () => {
      const proj = new Projection(Projection.DEFAULT_BOUNDS, { width: 1024, height: 768 });

      const testViewports = [
        { zoom: 1.0, panX: 0, panY: 0, width: 1024, height: 768 },
        { zoom: 2.5, panX: 120, panY: -80, width: 1024, height: 768 },
        { zoom: 5.0, panX: -300, panY: 450, width: 1920, height: 1080 },
        { zoom: 10.0, panX: 50, panY: 50, width: 400, height: 300 }
      ];

      const testPoints = [
        { lat: 48.6865, lng: 6.1504 },
        { lat: 48.6750, lng: 6.1350 },
        { lat: 48.7020, lng: 6.1950 },
        { lat: 48.6975, lng: 6.1425 },
        { lat: 48.6936, lng: 6.1832 }
      ];

      testViewports.forEach((vp, vpIdx) => {
        testPoints.forEach((pt, ptIdx) => {
          const screen = proj.geoToScreen(pt.lat, pt.lng, vp);
          const geoBack = proj.screenToGeo(screen.x, screen.y, vp);

          const latDiff = Math.abs(geoBack.lat - pt.lat);
          const lngDiff = Math.abs(geoBack.lng - pt.lng);

          assert.ok(
            latDiff < 1e-9,
            `Roundtrip lat error too high at VP ${vpIdx}, PT ${ptIdx}: ${latDiff}`
          );
          assert.ok(
            lngDiff < 1e-9,
            `Roundtrip lng error too high at VP ${vpIdx}, PT ${ptIdx}: ${lngDiff}`
          );
        });
      });
    });

    it('should verify metric distortion and cosine latitude scaling factor', () => {
      const centerLat = 48.6865;
      const centerLng = 6.1504;
      const expectedCos = Math.cos((centerLat * Math.PI) / 180); // ~0.660184

      const bounds = { minLat: 48.6650, maxLat: 48.7080, minLng: 6.1200, maxLng: 6.2000 };
      const proj = new Projection(bounds, { width: 800, height: 600 });

      const calculatedCos = proj.cosRefLat;
      assert.ok(
        Math.abs(calculatedCos - expectedCos) < 1e-5,
        `Cosine ref lat scaling mismatch: got ${calculatedCos}, expected ${expectedCos}`
      );

      // Verify aspect ratio preservation
      const geoAR = proj.getAspectRatio();
      const expectedGeoAR = ((bounds.maxLng - bounds.minLng) * expectedCos) / (bounds.maxLat - bounds.minLat);
      assert.ok(
        Math.abs(geoAR - expectedGeoAR) < 1e-5,
        `Geographic aspect ratio calculation mismatch: got ${geoAR}, expected ${expectedGeoAR}`
      );
    });

    it('should handle zero-span and inverted bounds defensively', () => {
      const proj = new Projection();
      
      // Zero span bounds
      assert.doesNotThrow(() => {
        proj.setBounds({ minLat: 48.68, maxLat: 48.68, minLng: 6.15, maxLng: 6.15 });
      });
      const worldZero = proj.geoToWorld(48.68, 6.15);
      assert.ok(isFinite(worldZero.x) && isFinite(worldZero.y), 'Zero-span should not yield NaN');

      // Inverted bounds (min > max)
      assert.doesNotThrow(() => {
        proj.setBounds({ minLat: 48.70, maxLat: 48.60, minLng: 6.20, maxLng: 6.10 });
      });
      assert.ok(proj.bounds.minLat < proj.bounds.maxLat, 'Inverted bounds should be swapped');
      assert.ok(proj.bounds.minLng < proj.bounds.maxLng, 'Inverted bounds should be swapped');
    });

    it('should handle invalid lat/lng and viewport parameters gracefully', () => {
      const proj = new Projection();

      // Invalid lat/lng
      const invalidGeo1 = proj.geoToWorld(NaN, undefined);
      assert.deepEqual(invalidGeo1, { x: 0.5, y: 0.5 });

      const invalidGeo2 = proj.geoToWorld('abc', null);
      assert.deepEqual(invalidGeo2, { x: 0.5, y: 0.5 });

      // Out of bounds lat/lng
      assert.equal(proj.isPointInBounds(90, 180), false);
      assert.equal(proj.isPointInBounds(NaN, 6.15), false);

      // Invalid screen coords
      const invalidWorld = proj.screenToWorld(Infinity, -Infinity);
      assert.deepEqual(invalidWorld, { x: 0.5, y: 0.5 });
    });
  });
});
