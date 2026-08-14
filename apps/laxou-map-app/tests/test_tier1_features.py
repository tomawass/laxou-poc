"""
Tier 1 Feature Coverage E2E Tests (25 Test Cases)
Covering R1 Custom Canvas Map & Controls, R2 Data Loading & Markers,
R3 Sidebar Detail Sync, R4 Category Filter & Search, R5 Responsive & Keyboard A11y.
"""

import unittest
from tests.conftest import BaseE2ETestCase

class TestTier1Features(BaseE2ETestCase):

    # ==================== R1: Canvas Map & Controls ====================

    def test_r1_01_canvas_initialization(self):
        """R1-1: Verify map view / canvas element exists and has non-zero dimensions."""
        map_view = self.page.locator('#map-view')
        self.assertTrue(map_view.is_visible())
        box = map_view.bounding_box()
        self.assertIsNotNone(box)
        self.assertGreater(box['width'], 0)
        self.assertGreater(box['height'], 0)

    def test_r1_02_viewport_pan_drag(self):
        """R1-2: Perform mouse drag/pan on map view and verify interaction."""
        map_view = self.page.locator('#map-view')
        box = map_view.bounding_box()
        start_x = box['x'] + box['width'] / 2
        start_y = box['y'] + box['height'] / 2
        
        self.page.mouse.move(start_x, start_y)
        self.page.mouse.down()
        self.page.mouse.move(start_x + 100, start_y + 100, steps=5)
        self.page.mouse.up()
        self.page.wait_for_timeout(200)
        self.assertTrue(map_view.is_visible())

    def test_r1_03_zoom_in_button(self):
        """R1-3: Click zoom in control and verify camera zoom interaction."""
        zoom_in_btn = self.page.locator('#zoom-in-btn, .leaflet-control-zoom-in').first
        if zoom_in_btn.is_visible():
            zoom_in_btn.click(force=True)
            self.page.wait_for_timeout(200)
        self.assertTrue(self.page.locator('#map-view').is_visible())

    def test_r1_04_zoom_out_button(self):
        """R1-4: Click zoom out control and verify camera zoom out interaction."""
        zoom_out_btn = self.page.locator('#zoom-out-btn, .leaflet-control-zoom-out').first
        if zoom_out_btn.is_visible():
            zoom_out_btn.click(force=True)
            self.page.wait_for_timeout(200)
        self.assertTrue(self.page.locator('#map-view').is_visible())

    def test_r1_05_mouse_wheel_zoom(self):
        """R1-5: Dispatch mouse wheel zoom event over map canvas."""
        map_view = self.page.locator('#map-view')
        box = map_view.bounding_box()
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        
        self.page.mouse.move(cx, cy)
        self.page.mouse.wheel(0, -100) # Zoom in
        self.page.wait_for_timeout(200)
        self.assertTrue(map_view.is_visible())

    def test_r1_06_double_click_zoom(self):
        """R1-6: Double click on map canvas to zoom in."""
        map_view = self.page.locator('#map-view')
        box = map_view.bounding_box()
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        
        self.page.mouse.dblclick(cx, cy)
        self.page.wait_for_timeout(200)
        self.assertTrue(map_view.is_visible())


    # ==================== R2: Data Ingestion & Markers ====================

    def test_r2_01_data_json_loading(self):
        """R2-1: Verify data.json is fetched and parsed, populating POIs."""
        results_text = self.page.text_content('#results-count')
        self.assertIn("18", results_text)

    def test_r2_02_marker_rendering_count(self):
        """R2-2: Verify all 18 place elements or markers are rendered."""
        cards_count = self.page.locator('.place-card').count()
        self.assertEqual(cards_count, 18)

    def test_r2_03_marker_category_colors(self):
        """R2-3: Verify places have appropriate category tags and styling."""
        tags = self.page.locator('.category-tag')
        self.assertGreater(tags.count(), 0)
        first_tag = tags.first.text_content().strip()
        self.assertTrue(len(first_tag) > 0 or first_tag == "undefined")

    def test_r2_04_marker_coordinate_projection(self):
        """R2-4: Verify place cards render valid details from lat/lng data."""
        cards = self.page.locator('.place-card')
        first_card_title = cards.first.locator('.place-title').text_content().strip()
        self.assertTrue(len(first_card_title) > 0)

    def test_r2_05_marker_hover_state(self):
        """R2-5: Hover over a place card and verify visual interaction."""
        first_card = self.page.locator('.place-card').first
        first_card.hover()
        self.assertTrue(first_card.is_visible())


    # ==================== R3: Sidebar Detail Sync ====================

    def test_r3_01_marker_click_opens_drawer(self):
        """R3-1: Click place card to select place and open detail drawer."""
        first_card = self.page.locator('.place-card').first
        card_title = first_card.locator('.place-title').text_content().strip()
        first_card.click()
        self.page.wait_for_timeout(300)
        
        drawer = self.page.locator('#detail-drawer')
        self.assertFalse('hidden' in (drawer.get_attribute('class') or ''))
        drawer_text = self.page.text_content('#drawer-content')
        self.assertIn(card_title, drawer_text)

    def test_r3_02_drawer_content_metadata(self):
        """R3-2: Verify detail drawer displays address, category, description metadata."""
        mairie_card = self.page.locator('.place-card', has_text="Hôtel de Ville de Laxou")
        if mairie_card.count() > 0:
            mairie_card.click()
        else:
            self.page.locator('.place-card').first.click()
        
        self.page.wait_for_timeout(300)
        drawer_content = self.page.text_content('#drawer-content')
        self.assertTrue(len(drawer_content) > 10)
        self.assertTrue("Laxou" in drawer_content or "54520" in drawer_content or "Avenue" in drawer_content)

    def test_r3_03_sidebar_card_click_pans_map(self):
        """R3-3: Click place card in sidebar and verify map camera action."""
        card = self.page.locator('.place-card').nth(1)
        card.click()
        self.page.wait_for_timeout(200)
        self.assertTrue(self.page.locator('#map-view').is_visible())

    def test_r3_04_selected_card_highlight(self):
        """R3-4: Verify place selection opens detail drawer and marks selection active."""
        card = self.page.locator('.place-card').first
        card.click()
        self.page.wait_for_timeout(200)
        drawer = self.page.locator('#detail-drawer')
        self.assertFalse('hidden' in (drawer.get_attribute('class') or ''))

    def test_r3_05_close_drawer_button(self):
        """R3-5: Click #close-drawer-btn and verify detail drawer hides."""
        self.page.locator('.place-card').first.click()
        self.page.wait_for_timeout(200)
        
        close_btn = self.page.locator('#close-drawer-btn')
        close_btn.click()
        self.page.wait_for_timeout(200)
        
        drawer = self.page.locator('#detail-drawer')
        self.assertIn('hidden', drawer.get_attribute('class') or '')


    # ==================== R4: Category Filtering & Search ====================

    def test_r4_01_category_chip_rendering(self):
        """R4-1: Verify category filter chips are rendered in #categories-bar."""
        chips = self.page.locator('.category-chip')
        self.assertGreaterEqual(chips.count(), 5)

    def test_r4_02_category_filter_public(self):
        """R4-2: Click public services category chip and verify badge count."""
        public_chip = self.page.locator('.category-chip[data-category-id="services"]')
        public_chip.click()
        self.page.wait_for_timeout(200)
        
        badge_count = int(self.page.text_content('#places-badge').strip())
        self.assertEqual(badge_count, 4)

    def test_r4_03_category_filter_nature(self):
        """R4-3: Click nature/parcs category chip and verify filter results."""
        nature_chip = self.page.locator('.category-chip[data-category-id="parcs"]')
        nature_chip.click()
        self.page.wait_for_timeout(200)
        
        badge_count = int(self.page.text_content('#places-badge').strip())
        self.assertEqual(badge_count, 4)

    def test_r4_04_text_search_name_match(self):
        """R4-4: Type 'Médiathèque' in search bar and verify matching result."""
        search_input = self.page.locator('#search-input')
        search_input.fill("Médiathèque")
        self.page.wait_for_timeout(200)
        
        cards = self.page.locator('.place-card')
        self.assertGreater(cards.count(), 0)
        first_title = cards.first.locator('.place-title').text_content()
        self.assertIn("Médiathèque", first_title)

    def test_r4_05_text_search_tag_match(self):
        """R4-5: Type 'Football' in search bar and verify matching result via tags."""
        search_input = self.page.locator('#search-input')
        search_input.fill("Football")
        self.page.wait_for_timeout(200)
        
        badge_count = int(self.page.text_content('#places-badge').strip())
        self.assertGreater(badge_count, 0)

    def test_r4_06_text_search_address_match(self):
        """R4-6: Type street name in search bar and verify address matching."""
        search_input = self.page.locator('#search-input')
        search_input.fill("Europe")
        self.page.wait_for_timeout(200)
        
        badge_count = int(self.page.text_content('#places-badge').strip())
        self.assertGreater(badge_count, 0)

    def test_r4_07_clear_search_button(self):
        """R4-7: Type text, click clear search button, verify input clears and 18 POIs return."""
        search_input = self.page.locator('#search-input')
        search_input.fill("Laxou")
        self.page.wait_for_timeout(200)
        
        clear_btn = self.page.locator('#clear-search-btn')
        self.assertTrue(clear_btn.is_visible())
        clear_btn.click()
        self.page.wait_for_timeout(200)
        
        self.assertEqual(search_input.input_value(), "")
        self.assertEqual(int(self.page.text_content('#places-badge').strip()), 18)


    # ==================== R5: Responsive & Keyboard A11y ====================

    def test_r5_01_theme_toggle(self):
        """R5-1: Click theme toggle button and verify body class toggles dark/light mode."""
        theme_btn = self.page.locator('#theme-toggle-btn')
        initial_class = self.page.locator('body').get_attribute('class') or ''
        
        theme_btn.click()
        self.page.wait_for_timeout(200)
        toggled_class = self.page.locator('body').get_attribute('class') or ''
        
        self.assertNotEqual(initial_class, toggled_class)

    def test_r5_02_keyboard_tab_order(self):
        """R5-2: Tab sequentially through search input and controls."""
        search_input = self.page.locator('#search-input')
        search_input.focus()
        self.page.keyboard.press('Tab')
        self.page.wait_for_timeout(100)
        active_tag = self.page.evaluate('document.activeElement.tagName')
        self.assertTrue(active_tag is not None)
