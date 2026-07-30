from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class DashboardPage(BasePage):
    # Sidebar navigation links (Desktop - class contains md:flex)
    NAV_DASHBOARD = (By.XPATH, "//nav[contains(@class, 'md:flex')]//a[@href='/']")
    NAV_MODELER = (By.XPATH, "//nav[contains(@class, 'md:flex')]//a[@href='/modeler']")
    NAV_FOCUS = (By.XPATH, "//nav[contains(@class, 'md:flex')]//a[@href='/sync']")
    NAV_ANALYSIS = (By.XPATH, "//nav[contains(@class, 'md:flex')]//a[@href='/insights']")
    
    # Mobile navigation links (Mobile - class contains md:hidden)
    MOB_NAV_DASHBOARD = (By.XPATH, "//nav[contains(@class, 'md:hidden')]//a[@href='/']")
    MOB_NAV_MODELER = (By.XPATH, "//nav[contains(@class, 'md:hidden')]//a[@href='/modeler']")
    MOB_NAV_FOCUS = (By.XPATH, "//nav[contains(@class, 'md:hidden')]//a[@href='/sync']")
    MOB_NAV_ANALYSIS = (By.XPATH, "//nav[contains(@class, 'md:hidden')]//a[@href='/insights']")

    # Logout button
    LOGOUT_BUTTON = (By.XPATH, "//button[contains(., 'Sign out') or .//*[contains(text(), 'Sign out')]]")

    # Modeler Form elements (when on /modeler)
    TITLE_INPUT = (By.XPATH, "//input[@placeholder='e.g. Strategic Planning Session']")
    CATEGORY_TRIGGER = (By.XPATH, "//button[contains(@class, 'SelectTrigger') or @role='combobox']")
    DURATION_INPUT = (By.XPATH, "//input[@type='number']")
    TIME_INPUT = (By.XPATH, "//input[@type='time']")
    ESTABLISH_BUTTON = (By.XPATH, "//button[contains(text(), 'Establish Intention') or contains(., 'Establish Intention')]")
    
    # Intention items
    INTENTION_CARDS = (By.XPATH, "//div[contains(@class, 'clean-card')]")

    def click_nav_dashboard(self):
        try:
            self.click(self.NAV_DASHBOARD, timeout=2)
        except Exception:
            self.click(self.MOB_NAV_DASHBOARD, timeout=2)

    def click_nav_modeler(self):
        try:
            self.click(self.NAV_MODELER, timeout=2)
        except Exception:
            self.click(self.MOB_NAV_MODELER, timeout=2)

    def click_nav_focus(self):
        try:
            self.click(self.NAV_FOCUS, timeout=2)
        except Exception:
            self.click(self.MOB_NAV_FOCUS, timeout=2)

    def click_nav_analysis(self):
        try:
            self.click(self.NAV_ANALYSIS, timeout=2)
        except Exception:
            self.click(self.MOB_NAV_ANALYSIS, timeout=2)

    def logout(self):
        self.click(self.LOGOUT_BUTTON)

    def create_intention(self, title, category, duration, start_time=None):
        self.clear(self.TITLE_INPUT)
        self.type(self.TITLE_INPUT, title)
        
        # Category dropdown selection
        self.click(self.CATEGORY_TRIGGER)
        
        # Target only Radix UI select options strictly matching the lowercase category
        category_item = (By.XPATH, f"//div[@role='option' and @data-value='{category}'] | //div[@role='option' and .//*[translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='{category}']] | //div[@role='option'][translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='{category}']")
        self.click(category_item)
        
        # Duration
        self.clear(self.DURATION_INPUT)
        self.type(self.DURATION_INPUT, str(duration))
        
        # Start Time
        if start_time:
            self.clear(self.TIME_INPUT)
            self.type(self.TIME_INPUT, start_time)
            
        self.click(self.ESTABLISH_BUTTON)

    def get_intentions_count(self):
        elements = self.driver.find_elements(*self.INTENTION_CARDS)
        return len(elements)
