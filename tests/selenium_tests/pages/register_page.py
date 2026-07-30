from selenium.webdriver.common.by import By
from pages.base_page import BasePage

class RegisterPage(BasePage):
    NAME_INPUT = (By.ID, "name")
    EMAIL_INPUT = (By.ID, "email")
    PASSWORD_INPUT = (By.ID, "password")
    CONFIRM_PASSWORD_INPUT = (By.ID, "confirmPassword")
    SUBMIT_BUTTON = (By.XPATH, "//button[@type='submit']")
    LOGIN_LINK = (By.XPATH, "//a[@href='/login']")
    CARD_TITLE = (By.XPATH, "//h1[contains(text(), 'Join GapLogic')]")

    def enter_name(self, name):
        self.clear(self.NAME_INPUT)
        self.type(self.NAME_INPUT, name)

    def enter_email(self, email):
        self.clear(self.EMAIL_INPUT)
        self.type(self.EMAIL_INPUT, email)

    def enter_password(self, password):
        self.clear(self.PASSWORD_INPUT)
        self.type(self.PASSWORD_INPUT, password)

    def enter_confirm_password(self, confirm_password):
        self.clear(self.CONFIRM_PASSWORD_INPUT)
        self.type(self.CONFIRM_PASSWORD_INPUT, confirm_password)

    def click_submit(self):
        self.click(self.SUBMIT_BUTTON)

    def register(self, name, email, password, confirm_password):
        self.enter_name(name)
        self.enter_email(email)
        self.enter_password(password)
        self.enter_confirm_password(confirm_password)
        self.click_submit()

    def click_login(self):
        self.click(self.LOGIN_LINK)

    def is_on_page(self):
        return self.is_displayed(self.CARD_TITLE)
