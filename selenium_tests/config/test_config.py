import os

# Base URL of the website under test
BASE_URL = os.environ.get("SELENIUM_BASE_URL", "http://localhost:9002")

# Default explicit wait timeout in seconds
DEFAULT_TIMEOUT = int(os.environ.get("SELENIUM_DEFAULT_TIMEOUT", "10"))

# Browser selection: chrome, firefox, edge
BROWSER = os.environ.get("SELENIUM_BROWSER", "chrome").lower()

# Headless mode flag
HEADLESS = os.environ.get("SELENIUM_HEADLESS", "true").lower() == "true"

# Screenshot configurations
SCREENSHOT_ON_FAILURE = True
SCREENSHOT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
    "reports", 
    "screenshots"
)

# Parallel worker count (passed to pytest-xdist)
PARALLEL_WORKERS = os.environ.get("SELENIUM_WORKERS", "4")
