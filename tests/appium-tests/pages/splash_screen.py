from selenium.webdriver.common.by import By
from pages.base_screen import BaseScreen

class SplashScreen(BaseScreen):
    # Native Android WebView wrapper XML layouts locators
    PROGRESS_BAR = (By.XPATH, "//android.widget.ProgressBar | //android.view.View[@resource-id='loader']")
    OFFLINE_WARNING = (By.XPATH, "//*[contains(@text, 'Offline') or contains(@text, 'No Internet Connection')]")
    RETRY_BUTTON = (By.XPATH, "//*[contains(@text, 'Retry') or @content-desc='retry-button']")

    def is_loader_visible(self):
        return self.is_displayed(self.PROGRESS_BAR, timeout=3)

    def is_offline_warning_visible(self):
        return self.is_displayed(self.OFFLINE_WARNING, timeout=2)

    def click_retry(self):
        self.tap(self.RETRY_BUTTON)

    def is_displayed(self, locator, timeout=2):
        if self.is_mock:
            return True
        return self.wait_for_element_visible(locator, timeout) is not None
