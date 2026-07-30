from selenium.webdriver.common.by import By
from pages.base_screen import BaseScreen

class InsightsScreen(BaseScreen):
    CHART_CONTAINER = (By.XPATH, "//*[@resource-id='recharts-responsive-container'] | //*[contains(@class, 'recharts-wrapper')]")
    METRICS_WIDGET = (By.XPATH, "//*[contains(@text, 'Promise Fulfillment') or @content-desc='metrics-widget']")
    STATS_METER = (By.XPATH, "//*[contains(@text, 'Intentions Established') or @content-desc='stats-meter']")

    def is_chart_visible(self):
        if self.is_mock:
            return True
        return self.wait_for_element_visible(self.CHART_CONTAINER, timeout=3) is not None

    def is_widget_visible(self):
        if self.is_mock:
            return True
        return self.wait_for_element_visible(self.METRICS_WIDGET, timeout=2) is not None
