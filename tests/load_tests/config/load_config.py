# Load Test Configuration Settings

BASE_URL = "http://localhost:9002"
VUS = 100              # Concurrent Virtual Users
DURATION = 60          # Test run duration in seconds
RAMP_UP = 10           # Ramp-up duration from 0 to 100 VUs in seconds

# Performance Threshold Criteria
TARGET_RPS = 120
THRESHOLDS = {
    "avg_latency_ms": 300.0,
    "p95_latency_ms": 800.0,
    "error_rate": 1.0  # Maximum acceptable error percentage (1.0%)
}

# Scenarios configurations
ENDPOINTS = [
    {"path": "/", "weight": 40, "method": "GET", "name": "Homepage"},
    {"path": "/modeler", "weight": 20, "method": "GET", "name": "Modeler Frontend"},
    {"path": "/insights", "weight": 20, "method": "GET", "name": "Insights Frontend"},
    {"path": "/api/auth/login", "weight": 10, "method": "POST", "name": "Login API"},
    {"path": "/api/intentions", "weight": 10, "method": "POST", "name": "Create Intention API"}
]
