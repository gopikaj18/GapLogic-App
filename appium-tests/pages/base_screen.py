import time
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class BaseScreen:
    def __init__(self, driver):
        self.driver = driver
        # Check if running under Mock Appium Session
        self.is_mock = getattr(driver, "is_mock", False)

    def wait_for_element(self, locator, timeout=10):
        if self.is_mock:
            return True
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located(locator)
            )
        except TimeoutException:
            return None

    def wait_for_element_visible(self, locator, timeout=10):
        if self.is_mock:
            return True
        try:
            return WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located(locator)
            )
        except TimeoutException:
            return None

    def tap(self, locator, timeout=10):
        if self.is_mock:
            return
        el = self.wait_for_element_visible(locator, timeout)
        if el:
            el.click()
        else:
            raise Exception(f"Element not visible for tap: {locator}")

    def type(self, locator, text, timeout=10):
        if self.is_mock:
            return
        el = self.wait_for_element_visible(locator, timeout)
        if el:
            el.send_keys(text)
        else:
            raise Exception(f"Element not visible for type: {locator}")

    def clear(self, locator, timeout=10):
        if self.is_mock:
            return
        el = self.wait_for_element_visible(locator, timeout)
        if el:
            el.clear()

    # Mobile Touch Gestures
    def swipe(self, start_x, start_y, end_x, end_y, duration_ms=500):
        if self.is_mock:
            return
        # Standard Appium TouchAction or W3C Action Chain gesture
        action = {
            "actions": [
                {
                    "type": "pointer",
                    "id": "finger1",
                    "parameters": {"pointerType": "touch"},
                    "actions": [
                        {"type": "pointerMove", "duration": 0, "x": start_x, "y": start_y},
                        {"type": "pointerDown", "button": 0},
                        {"type": "pointerMove", "duration": duration_ms, "x": end_x, "y": end_y},
                        {"type": "pointerUp", "button": 0}
                    ]
                }
            ]
        }
        self.driver.perform_actions(action)

    def scroll_down(self):
        if self.is_mock:
            return
        # Standard scroll helper using window size percentages
        size = self.driver.get_window_size()
        start_x = int(size["width"] * 0.5)
        start_y = int(size["height"] * 0.8)
        end_x = start_x
        end_y = int(size["height"] * 0.2)
        self.swipe(start_x, start_y, end_x, end_y)

    def swipe_left(self):
        if self.is_mock:
            return
        size = self.driver.get_window_size()
        start_x = int(size["width"] * 0.9)
        start_y = int(size["height"] * 0.5)
        end_x = int(size["width"] * 0.1)
        end_y = start_y
        self.swipe(start_x, start_y, end_x, end_y)
        
    def swipe_right(self):
        if self.is_mock:
            return
        size = self.driver.get_window_size()
        start_x = int(size["width"] * 0.1)
        start_y = int(size["height"] * 0.5)
        end_x = int(size["width"] * 0.9)
        end_y = start_y
        self.swipe(start_x, start_y, end_x, end_y)

    def long_press(self, locator, duration_ms=1000):
        if self.is_mock:
            return
        el = self.wait_for_element_visible(locator)
        if el:
            loc = el.location
            x, y = loc["x"], loc["y"]
            action = {
                "actions": [
                    {
                        "type": "pointer",
                        "id": "finger1",
                        "parameters": {"pointerType": "touch"},
                        "actions": [
                            {"type": "pointerMove", "duration": 0, "x": x, "y": y},
                            {"type": "pointerDown", "button": 0},
                            {"type": "pause", "duration": duration_ms},
                            {"type": "pointerUp", "button": 0}
                        ]
                    }
                ]
            }
            self.driver.perform_actions(action)
