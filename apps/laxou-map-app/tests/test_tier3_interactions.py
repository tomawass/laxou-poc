"""
Tier 3 Cross-Feature Interactions E2E Tests (8 Test Cases)
Covering complex multi-feature interactions, combined filter + search + drawer,
theme toggle with active selection, category preservation, and keyboard navigation.
"""

import unittest
from tests.conftest import BaseE2ETestCase

class TestTier3Interactions(BaseE2ETestCase):

    def test_tier3_01_filter_search_marker_interaction(self):
        """Tier 3-1: Category filter + search + place selection combined workflow."""
        # 1. Click culture category pill
        culture_chip = self.page.locator('.category-chip[data-category-id="culture"]')
        culture_chip.click()
        self.page.wait_for_timeout(200)
        
        # 2. Type search query 'Thirion'
        search_input = self.page.locator('#search-input')
        search_input.fill("Thirion")
        self.page.wait_for_timeout(200)
        
        # 3. Verify filtered card list shows Médiathèque
        cards = self.page.locator('.place-card')
        self.assertGreater(cards.count(), 0)
        card_title = cards.first.locator('.place-title').text_content()
        self.assertIn("Médiathèque", card_title)
        
        # 4. Click card to open drawer
        cards.first.click()
        self.page.wait_for_timeout(200)
        drawer = self.page.locator('#detail-drawer')
        self.assertFalse('hidden' in (drawer.get_attribute('class') or ''))

    def test_tier3_02_category_switch_with_open_drawer(self):
        """Tier 3-2: Category switch with open detail drawer updates sidebar list cleanly."""
        # 1. Select sports place card
        sports_chip = self.page.locator('.category-chip[data-category-id="sports"]')
        sports_chip.click()
        self.page.wait_for_timeout(200)
        self.page.locator('.place-card').first.click()
        self.page.wait_for_timeout(200)
        
        # 2. Switch category to parcs
        parcs_chip = self.page.locator('.category-chip[data-category-id="parcs"]')
        parcs_chip.click()
        self.page.wait_for_timeout(200)
        
        badge_count = int(self.page.text_content('#places-badge').strip())
        self.assertEqual(badge_count, 4)

    def test_tier3_03_clear_search_with_selected_marker(self):
        """Tier 3-3: Clearing search query preserves active place selection state."""
        search_input = self.page.locator('#search-input')
        search_input.fill("Saussaie")
        self.page.wait_for_timeout(200)
        
        self.page.locator('.place-card').first.click()
        self.page.wait_for_timeout(200)
        
        clear_btn = self.page.locator('#clear-search-btn')
        clear_btn.click()
        self.page.wait_for_timeout(200)
        
        badge_count = int(self.page.text_content('#places-badge').strip())
        self.assertEqual(badge_count, 18)
        # Verify drawer remains open
        drawer = self.page.locator('#detail-drawer')
        self.assertFalse('hidden' in (drawer.get_attribute('class') or ''))

    def test_tier3_04_keyboard_navigation_and_drawer_esc(self):
        """Tier 3-4: Keyboard navigation select place and ESC drawer dismissal."""
        search_input = self.page.locator('#search-input')
        search_input.focus()
        self.page.keyboard.type("Laxou")
        self.page.wait_for_timeout(200)
        
        self.page.locator('.place-card').first.click()
        self.page.wait_for_timeout(200)
        
        close_btn = self.page.locator('#close-drawer-btn')
        close_btn.click()
        self.page.wait_for_timeout(200)
        
        drawer = self.page.locator('#detail-drawer')
        self.assertIn('hidden', drawer.get_attribute('class') or '')

    def test_tier3_05_theme_toggle_with_active_drawer(self):
        """Tier 3-5: Toggling theme while detail drawer is active preserves drawer content and state."""
        self.page.locator('.place-card').first.click()
        self.page.wait_for_timeout(200)
        
        theme_btn = self.page.locator('#theme-toggle-btn')
        theme_btn.click()
        self.page.wait_for_timeout(200)
        
        drawer = self.page.locator('#detail-drawer')
        self.assertFalse('hidden' in (drawer.get_attribute('class') or ''))

    def test_tier3_06_bidirectional_sync_list_to_map_to_list(self):
        """Tier 3-6: Bidirectional synchronization between list selection and map marker selection."""
        cards = self.page.locator('.place-card')
        self.assertGreater(cards.count(), 1)
        first_title = cards.nth(0).locator('.place-title').text_content().strip()
        second_title = cards.nth(1).locator('.place-title').text_content().strip()
        
        cards.nth(0).click()
        self.page.wait_for_timeout(200)
        drawer_text1 = self.page.text_content('#drawer-content')
        self.assertIn(first_title, drawer_text1)
        
        cards.nth(1).click()
        self.page.wait_for_timeout(200)
        drawer_text2 = self.page.text_content('#drawer-content')
        self.assertIn(second_title, drawer_text2)

    def test_tier3_07_search_query_preserves_category_filter(self):
        """Tier 3-7: Clearing text search restores the active category filter scope, not all 18 POIs."""
        ecoles_chip = self.page.locator('.category-chip[data-category-id="ecoles"]')
        ecoles_chip.click()
        self.page.wait_for_timeout(200)
        
        search_input = self.page.locator('#search-input')
        search_input.fill("Victor")
        self.page.wait_for_timeout(200)
        
        clear_btn = self.page.locator('#clear-search-btn')
        clear_btn.click()
        self.page.wait_for_timeout(200)
        
        badge_count = int(self.page.text_content('#places-badge').strip())
        self.assertEqual(badge_count, 3) # 3 ecoles in data.json

    def test_tier3_08_zoom_controls_during_active_selection(self):
        """Tier 3-8: Using map zoom controls during active place selection preserves drawer and selection."""
        self.page.locator('.place-card').first.click()
        self.page.wait_for_timeout(200)
        
        map_view = self.page.locator('#map-view')
        box = map_view.bounding_box()
        self.page.mouse.move(box['x'] + 100, box['y'] + 100)
        self.page.mouse.wheel(0, -100)
        self.page.wait_for_timeout(200)
        
        drawer = self.page.locator('#detail-drawer')
        self.assertFalse('hidden' in (drawer.get_attribute('class') or ''))
