import os

# Target API Configurations
BASE_URL = "http://localhost:9002"
TIMEOUT = 5.0

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
LOGS_DIR = os.path.join(BASE_DIR, "logs")

# Throttling test configurations
THROTTLE_REQUESTS_COUNT = 15
