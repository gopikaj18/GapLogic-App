from selenium.webdriver.common.by import By
from pages.base_screen import BaseScreen

class AuthScreen(BaseScreen):
    # WebView fields
    EMAIL_INPUT = (By.XPATH, "//android.widget.EditText[@resource-id='email'] | //android.view.View[@resource-id='email'] | //input[@id='email']")
    PASSWORD_INPUT = (By.XPATH, "//android.widget.EditText[@resource-id='password'] | //android.view.View[@resource-id='password'] | //input[@id='password']")
    NAME_INPUT = (By.XPATH, "//android.widget.EditText[@resource-id='name'] | //android.view.View[@resource-id='name'] | //input[@id='name']")
    CONFIRM_PASSWORD_INPUT = (By.XPATH, "//android.widget.EditText[@resource-id='confirmPassword'] | //android.view.View[@resource-id='confirmPassword'] | //input[@id='confirmPassword']")
    SUBMIT_BUTTON = (By.XPATH, "//android.widget.Button[@text='Sign In' or @text='Create Account'] | //button[@type='submit']")

    def login(self, email, password):
        self.clear(self.EMAIL_INPUT)
        self.type(self.EMAIL_INPUT, email)
        self.clear(self.PASSWORD_INPUT)
        self.type(self.PASSWORD_INPUT, password)
        self.tap(self.SUBMIT_BUTTON)

    def register(self, name, email, password, confirm_password):
        self.clear(self.NAME_INPUT)
        self.type(self.NAME_INPUT, name)
        self.clear(self.EMAIL_INPUT)
        self.type(self.EMAIL_INPUT, email)
        self.clear(self.PASSWORD_INPUT)
        self.type(self.PASSWORD_INPUT, password)
        self.clear(self.CONFIRM_PASSWORD_INPUT)
        self.type(self.CONFIRM_PASSWORD_INPUT, confirm_password)
        self.tap(self.SUBMIT_BUTTON)
