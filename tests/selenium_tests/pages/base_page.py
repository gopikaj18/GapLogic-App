import os
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By

class BasePage:
    def __init__(self, driver, timeout=10):
        self.driver = driver
        self.timeout = timeout

    def navigate_to(self, url):
        self.driver.get(url)

    def get_url(self):
        return self.driver.current_url

    def wait_for_element_visible(self, locator, timeout=None):
        t = timeout or self.timeout
        try:
            return WebDriverWait(self.driver, t).until(
                EC.visibility_of_element_located(locator)
            )
        except TimeoutException:
            return None

    def wait_for_element_presence(self, locator, timeout=None):
        t = timeout or self.timeout
        try:
            return WebDriverWait(self.driver, t).until(
                EC.presence_of_element_located(locator)
            )
        except TimeoutException:
            return None

    def find_element(self, locator, timeout=None):
        self.wait_for_element_presence(locator, timeout)
        return self.driver.find_element(*locator)

    def click(self, locator, timeout=None):
        self.wait_for_element_visible(locator, timeout)
        el = self.driver.find_element(*locator)
        el.click()

    def type(self, locator, text, timeout=None):
        self.wait_for_element_visible(locator, timeout)
        el = self.driver.find_element(*locator)
        try:
            el.send_keys(text)
        except Exception:
            # Fallback to JavaScript injection to bypass ChromeDriver non-BMP character limitations (emojis)
            self.execute_script(
                "arguments[0].value = arguments[1]; "
                "arguments[0].dispatchEvent(new Event('input', { bubbles: true })); "
                "arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", 
                el, text
            )

    def clear(self, locator, timeout=None):
        self.wait_for_element_visible(locator, timeout)
        el = self.driver.find_element(*locator)
        el.clear()

    def get_text(self, locator, timeout=None):
        self.wait_for_element_visible(locator, timeout)
        el = self.driver.find_element(*locator)
        return el.text

    def is_displayed(self, locator, timeout=2):
        el = self.wait_for_element_visible(locator, timeout)
        return el is not None and el.is_displayed()

    def execute_script(self, script, *args):
        return self.driver.execute_script(script, *args)
