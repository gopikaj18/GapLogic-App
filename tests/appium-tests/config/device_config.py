import os

# Appium Server settings
APPIUM_SERVER_URL = "http://localhost:4723"

# Mock Mode configuration (set to True to enable mock session fallback when server/emulator is offline)
MOCK_MODE = True

# Target App Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APK_PATH = os.path.join(os.path.dirname(BASE_DIR), "apks", "gaplogic-debug.apk")

# Appium Capabilities Configurations
ANDROID_CAPABILITIES = {
    "platformName": "Android",
    "automationName": "UiAutomator2",
    "deviceName": "Android Emulator",
    "app": APK_PATH,
    "appPackage": "com.gaplogic.app",
    "appActivity": "com.gaplogic.app.MainActivity",
    "noReset": False,
    "fullReset": True,
    "newCommandTimeout": 300,
    "gpsEnabled": True
}

IOS_CAPABILITIES = {
    "platformName": "iOS",
    "automationName": "XCUITest",
    "deviceName": "iPhone 14 Simulator",
    "platformVersion": "17.0",
    "app": "path/to/gaplogic.app", # Path to simulator .app build
    "bundleId": "com.gaplogic.app",
    "noReset": False,
    "newCommandTimeout": 300
}
