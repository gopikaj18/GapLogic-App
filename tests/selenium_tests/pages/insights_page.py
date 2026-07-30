from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class InsightsPage(BasePage):
    PAGE_HEADER = (By.XPATH, "//h1[contains(text(), 'Behavioral Analytics')] | //h3[contains(text(), 'Mathematical Behavioral Drivers')] | //h3[contains(text(), 'Your Promise Meter:')]")
    CHARTS_CONTAINER = (By.CLASS_NAME, "recharts-responsive-container")
    METRIC_BADGE = (By.XPATH, "//span[contains(@class, 'text-primary') and contains(text(), '%')]")
    PROMISE_METER_CARD = (By.XPATH, "//*[contains(text(), 'Your Promise Meter:')]")

    def is_on_page(self):
        return self.is_displayed(self.PAGE_HEADER) or self.is_displayed(self.PROMISE_METER_CARD)

    def get_charts_count(self):
        elements = self.driver.find_elements(*self.CHARTS_CONTAINER)
        return len(elements)
