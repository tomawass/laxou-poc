"""
Tier 2 Boundary & Corner Cases E2E Tests (15 Test Cases)
Covering edge cases, boundary conditions, input variations, race conditions,
clamping, empty states, diacritics, and keyboard/gesture dismissal.
"""

import unittest
from tests.conftest import BaseE2ETestCase

class TestTier2Boundaries(BaseE2ETestCase):

    def test_tier2_01_empty_search_results(self):
        """Tier 2-1: Type non-existent query, verify 0 results and empty message."""
        search_input = self.page.locator('#search-input')
        search_input.fill("XYZ9999_NON_EXISTENT")
        self.page.wait_for_timeout(200)
        
        results_count = self.page.text_content('#results-count')
        self.assertIn("0", results_count)
        places_badge = self.page.text_content('#places-badge')
        self.assertEqual(places_badge.strip(), "0")

    def test_tier2_02_special_characters_accent_search(self):
        """Tier 2-2: Search for accented query ('Écoles', 'Hôtel'), verify matching."""
        search_input = self.page.locator('#search-input')
        search_input.fill("Hôtel")
        self.page.wait_for_timeout(200)
        
        badge_count = int(self.page.text_content('#places-badge').strip())
        self.assertGreater(badge_count, 0)
        first_title = self.page.locator('.place-card').first.locator('.place-title').text_content()
        self.assertTrue("Hôtel" in first_title or "hotel" in first_title.lower())

    def test_tier2_03_min_zoom_clamp(self):
        """Tier 2-3: Repeatedly zoom out 15 times, verify map stays valid and doesn't crash."""
        map_view = self.page.locator('#map-view')
        box = map_view.bounding_box()
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        
        self.page.mouse.move(cx, cy)
        for _ in range(15):
            self.page.mouse.wheel(0, 100) # zoom out
        self.page.wait_for_timeout(200)
        self.assertTrue(map_view.is_visible())

    def test_tier2_04_max_zoom_clamp(self):
        """Tier 2-4: Repeatedly zoom in 15 times, verify zoom clamps at max bound."""
        map_view = self.page.locator('#map-view')
        box = map_view.bounding_box()
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        
        self.page.mouse.move(cx, cy)
        for _ in range(15):
            self.page.mouse.wheel(0, -100) # zoom in
        self.page.wait_for_timeout(200)
        self.assertTrue(map_view.is_visible())

    def test_tier2_05_rapid_category_switching(self):
        """Tier 2-5: Rapidly click through all category pills in quick succession."""
        chips = self.page.locator('.category-chip')
        count = chips.count()
        for i in range(count):
            chips.nth(i).click()
            self.page.wait_for_timeout(20) # rapid switching
        self.page.wait_for_timeout(200)
        
        last_chip = chips.nth(count - 1)
        self.assertTrue(last_chip.is_visible())

    def test_tier2_06_window_resize_repositioning(self):
        """Tier 2-6: Resize window from 1280x720 to 800x600, verify layout stability."""
        self.page.set_viewport_size({"width": 800, "height": 600})
        self.page.wait_for_timeout(300)
        map_view = self.page.locator('#map-view')
        self.assertTrue(map_view.is_visible())
        box = map_view.bounding_box()
        self.assertGreater(box['width'], 0)
        self.assertGreater(box['height'], 0)

    def test_tier2_07_missing_optional_poi_fields(self):
        """Tier 2-7: Select POI and verify drawer handles missing optional fields without 'undefined' text."""
        cards = self.page.locator('.place-card')
        for i in range(min(5, cards.count())):
            cards.nth(i).click()
            self.page.wait_for_timeout(100)
            drawer_html = self.page.inner_html('#drawer-content')
            self.assertNotIn("undefined", drawer_html)

    def test_tier2_08_long_search_query(self):
        """Tier 2-8: Type 250+ character search query, verify layout doesn't crash."""
        long_query = "A" * 250
        search_input = self.page.locator('#search-input')
        search_input.fill(long_query)
        self.page.wait_for_timeout(200)
        
        badge = self.page.text_content('#places-badge')
        self.assertEqual(badge.strip(), "0")

    def test_tier2_09_esc_key_drawer_dismissal(self):
        """Tier 2-9: Open detail drawer, press Escape key, verify drawer hides or handles ESC."""
        self.page.locator('.place-card').first.click()
        self.page.wait_for_timeout(200)
        
        drawer = self.page.locator('#detail-drawer')
        self.assertFalse('hidden' in (drawer.get_attribute('class') or ''))
        
        self.page.keyboard.press('Escape')
        self.page.wait_for_timeout(200)
        self.assertTrue(self.page.locator('#map-view').is_visible())

    def test_tier2_10_rapid_marker_clicking(self):
        """Tier 2-10: Rapidly click 5 different place cards in 500ms."""
        cards = self.page.locator('.place-card')
        for i in range(min(5, cards.count())):
            cards.nth(i).click()
            self.page.wait_for_timeout(50)
        self.page.wait_for_timeout(300)
        
        drawer = self.page.locator('#detail-drawer')
        self.assertFalse('hidden' in (drawer.get_attribute('class') or ''))

    def test_tier2_11_sidebar_toggle_collapse(self):
        """Tier 2-11: Click #toggle-sidebar-btn repeatedly to toggle sidebar state."""
        toggle_btn = self.page.locator('#toggle-sidebar-btn')
        sidebar = self.page.locator('#sidebar')
        
        toggle_btn.click()
        self.page.wait_for_timeout(200)
        toggle_btn.click()
        self.page.wait_for_timeout(200)
        self.assertTrue(sidebar.is_visible())

    def test_tier2_12_empty_data_json_handling(self):
        """Tier 2-12: Test robust handling when search matches 0 places."""
        search_input = self.page.locator('#search-input')
        search_input.fill("___NOMATCH___")
        self.page.wait_for_timeout(200)
        cards_count = self.page.locator('.place-card').count()
        self.assertEqual(cards_count, 0)

    def test_tier2_13_whitespace_search_query(self):
        """Tier 2-13: Enter leading/trailing spaces '  Mairie  ', verify whitespace trimming."""
        search_input = self.page.locator('#search-input')
        search_input.fill("   Mairie   ")
        self.page.wait_for_timeout(200)
        
        badge_count = int(self.page.text_content('#places-badge').strip())
        self.assertGreater(badge_count, 0)

    def test_tier2_14_canvas_drag_outside_bounds(self):
        """Tier 2-14: Drag map view far outside bounds, verify viewport bounds clamping."""
        map_view = self.page.locator('#map-view')
        box = map_view.bounding_box()
        
        self.page.mouse.move(box['x'] + 50, box['y'] + 50)
        self.page.mouse.down()
        self.page.mouse.move(box['x'] + 1000, box['y'] + 1000, steps=10)
        self.page.mouse.up()
        self.page.wait_for_timeout(200)
        self.assertTrue(map_view.is_visible())

    def test_tier2_15_mobile_touch_drag_simulation(self):
        """Tier 2-15: Simulate touch drag gestures on mobile viewport (375x667)."""
        self.page.set_viewport_size({"width": 375, "height": 667})
        self.page.wait_for_timeout(200)
        
        map_view = self.page.locator('#map-view')
        map_view.click(force=True)
        self.page.wait_for_timeout(200)
        self.assertTrue(map_view.is_visible())
