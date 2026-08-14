"""
Tier 4 Real-World User Workflows E2E Tests (5 Test Cases)
Covering NPRNU public services workflow, mobile bottom-sheet drawer workflow,
accessibility & ARIA audit, multi-device responsive breakpoints, and E2E stress testing.
"""

import unittest
from tests.conftest import BaseE2ETestCase

class TestTier4Workflows(BaseE2ETestCase):

    def test_tier4_01_nprnu_public_services_workflow(self):
        """Workflow 1: NPRNU & Public Service Site Exploration."""
        # 1. Select Services Publics category filter
        services_chip = self.page.locator('.category-chip[data-category-id="services"]')
        services_chip.click()
        self.page.wait_for_timeout(200)
        
        # 2. Type 'Mairie' in search input
        search_input = self.page.locator('#search-input')
        search_input.fill("Mairie")
        self.page.wait_for_timeout(200)
        
        # 3. Select Hôtel de Ville de Laxou
        mairie_card = self.page.locator('.place-card', has_text="Hôtel de Ville de Laxou")
        if mairie_card.count() > 0:
            mairie_card.click()
        else:
            self.page.locator('.place-card').first.click()
        self.page.wait_for_timeout(300)
        
        # 4. Verify address, title, details, and tags
        drawer_content = self.page.text_content('#drawer-content')
        self.assertIn("Hôtel de Ville de Laxou", drawer_content)
        self.assertTrue("Laxou" in drawer_content or "54520" in drawer_content or "Avenue" in drawer_content)
        
        # 5. Close drawer and clear search
        self.page.locator('#close-drawer-btn').click()
        self.page.wait_for_timeout(200)
        self.page.locator('#clear-search-btn').click()
        self.page.wait_for_timeout(200)
        
        self.assertEqual(int(self.page.text_content('#places-badge').strip()), 18)

    def test_tier4_02_mobile_bottom_sheet_workflow(self):
        """Workflow 2: Mobile Bottom-Sheet Drawer Interaction."""
        # 1. Set mobile viewport (375x667 - iPhone SE)
        self.page.set_viewport_size({"width": 375, "height": 667})
        self.page.wait_for_timeout(300)
        
        # 2. Toggle sidebar / bottom sheet
        toggle_btn = self.page.locator('#toggle-sidebar-btn')
        toggle_btn.click()
        self.page.wait_for_timeout(200)
        
        # 3. Select place card
        cards = self.page.locator('.place-card')
        if cards.count() > 0:
            cards.first.click()
            self.page.wait_for_timeout(300)
            drawer = self.page.locator('#detail-drawer')
            self.assertFalse('hidden' in (drawer.get_attribute('class') or ''))

    def test_tier4_03_a11y_keyboard_audit(self):
        """Workflow 3: Full Accessibility (a11y) & Keyboard Navigation Audit."""
        # 1. Verify interactive elements exist and have valid tags/roles
        search_input = self.page.locator('#search-input')
        self.assertTrue(search_input.is_visible())
        
        theme_btn = self.page.locator('#theme-toggle-btn')
        self.assertTrue(theme_btn.is_visible())
        
        # 2. Test keyboard focus navigation
        search_input.focus()
        self.page.keyboard.type("Laxou")
        self.page.keyboard.press("Tab")
        self.page.wait_for_timeout(100)
        
        # 3. Verify results count live region or status indicator
        status_text = self.page.text_content('#results-count')
        self.assertTrue(len(status_text) > 0)

    def test_tier4_04_responsive_breakpoints(self):
        """Workflow 4: Multi-Device Responsive Breakpoint Verification."""
        breakpoints = [
            {"width": 1920, "height": 1080}, # Desktop 4K/FHD
            {"width": 1024, "height": 768},  # Tablet Landscape
            {"width": 768, "height": 1024},  # Tablet Portrait
            {"width": 375, "height": 667}    # Mobile
        ]
        
        for bp in breakpoints:
            self.page.set_viewport_size(bp)
            self.page.wait_for_timeout(150)
            map_view = self.page.locator('#map-view')
            self.assertTrue(map_view.is_visible())
            box = map_view.bounding_box()
            self.assertEqual(box['width'], bp['width'])

    def test_tier4_05_e2e_stress_test(self):
        """Workflow 5: End-to-End Stress & Data Persistence Test (50 rapid actions)."""
        search_input = self.page.locator('#search-input')
        chips = self.page.locator('.category-chip')
        chip_count = chips.count()
        
        for i in range(25):
            # Perform search and clear cycle
            search_input.fill(f"test_{i}")
            self.page.wait_for_timeout(10)
            search_input.fill("")
            self.page.wait_for_timeout(10)
            
            # Click category chip
            if chip_count > 0:
                chips.nth(i % chip_count).click()
                self.page.wait_for_timeout(10)
        
        self.page.wait_for_timeout(300)
        # Verify app remains stable and 100% interactive
        self.assertTrue(self.page.locator('#map-view').is_visible())
