from selenium.webdriver.common.by import By
from pages.base_screen import BaseScreen

class DashboardScreen(BaseScreen):
    INTENTION_TITLE = (By.XPATH, "//android.widget.EditText[@resource-id='title'] | //input[@id='title']")
    CATEGORY_TRIGGER = (By.XPATH, "//*[@resource-id='category-select'] | //button[contains(@id, 'radix')]")
    DURATION_INPUT = (By.XPATH, "//android.widget.EditText[@resource-id='duration'] | //input[@id='duration']")
    ESTABLISH_BUTTON = (By.XPATH, "//android.widget.Button[contains(@text, 'Establish')] | //button[@type='submit']")
    
    # Navigation tabs (represented as mobile bar links)
    MODELER_TAB = (By.XPATH, "//*[contains(@text, 'Modeler') or @content-desc='nav-modeler']")
    INSIGHTS_TAB = (By.XPATH, "//*[contains(@text, 'Analysis') or @content-desc='nav-insights']")
    FOCUS_TAB = (By.XPATH, "//*[contains(@text, 'Focus') or @content-desc='nav-focus']")

    def create_intention(self, title, category, duration):
        self.clear(self.INTENTION_TITLE)
        self.type(self.INTENTION_TITLE, title)
        
        # Tap trigger select
        self.tap(self.CATEGORY_TRIGGER)
        time_sleep = 0.2
        
        # Click option strictly matching category
        category_opt = (By.XPATH, f"//div[@role='option' and @data-value='{category}'] | //div[@role='option' and .//*[text()='{category}']] | //*[contains(@text, '{category}')]")
        self.tap(category_opt)
        
        self.clear(self.DURATION_INPUT)
        self.type(self.DURATION_INPUT, str(duration))
        self.tap(self.ESTABLISH_BUTTON)

    def navigate_to_modeler(self):
        self.tap(self.MODELER_TAB)

    def navigate_to_insights(self):
        self.tap(self.INSIGHTS_TAB)

    def navigate_to_focus(self):
        self.tap(self.FOCUS_TAB)
