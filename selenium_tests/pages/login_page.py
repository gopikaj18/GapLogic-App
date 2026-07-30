from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class LoginPage(BasePage):
    EMAIL_INPUT = (By.ID, "email")
    PASSWORD_INPUT = (By.ID, "password")
    SUBMIT_BUTTON = (By.XPATH, "//button[@type='submit']")
    GOOGLE_BUTTON = (By.XPATH, "//button[contains(text(), 'Google') or .//span[contains(text(), 'Google')]]")
    REGISTER_LINK = (By.XPATH, "//a[@href='/register']")
    CARD_TITLE = (By.XPATH, "//h1[contains(text(), 'Welcome Back')]")

    def enter_email(self, email):
        self.clear(self.EMAIL_INPUT)
        self.type(self.EMAIL_INPUT, email)

    def enter_password(self, password):
        self.clear(self.PASSWORD_INPUT)
        self.type(self.PASSWORD_INPUT, password)

    def click_submit(self):
        self.click(self.SUBMIT_BUTTON)

    def login(self, email, password):
        self.enter_email(email)
        self.enter_password(password)
        self.click_submit()

    def click_register(self):
        self.click(self.REGISTER_LINK)

    def is_on_page(self):
        return self.is_displayed(self.CARD_TITLE)
