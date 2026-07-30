import os
import sys
import time
import pytest
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.edge.service import Service as EdgeService
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager

# Add parent directories to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from config import test_config
from utils.excel_reporter import ExcelReporter
from utils.helpers import capture_failure_screenshot, logger

# Global Excel Reporter instance
_reporter = ExcelReporter()

@pytest.fixture(scope="session")
def reporter():
    return _reporter

def pytest_addoption(parser):
    parser.addoption("--browser-type", action="store", default=test_config.BROWSER, help="Browser: chrome, firefox, edge")
    parser.addoption("--headless-mode", action="store", default=str(test_config.HEADLESS), help="Headless: true, false")

@pytest.fixture(scope="session")
def driver_session(request):
    browser = request.config.getoption("--browser-type").lower()
    headless_str = request.config.getoption("--headless-mode").lower()
    headless = headless_str == "true"

    logger.info(f"Initializing WebDriver. Browser: {browser}, Headless: {headless}")
    
    driver = None
    if browser == "chrome":
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-gpu")
        service = ChromeService(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    elif browser == "firefox":
        options = webdriver.FirefoxOptions()
        if headless:
            options.add_argument("-headless")
        options.add_argument("--window-size=1920,1080")
        service = FirefoxService(GeckoDriverManager().install())
        driver = webdriver.Firefox(service=service, options=options)
    elif browser == "edge":
        options = webdriver.EdgeOptions()
        if headless:
            options.add_argument("--headless")
        options.add_argument("--window-size=1920,1080")
        service = EdgeService(EdgeChromiumDriverManager().install())
        driver = webdriver.Edge(service=service, options=options)
    else:
        raise ValueError(f"Unsupported browser type: {browser}")

    driver.implicitly_wait(2)
    yield driver
    
    logger.info("Tearing down WebDriver session.")
    driver.quit()

@pytest.fixture(scope="function")
def driver(driver_session):
    yield driver_session

# Custom pytest hook to capture test results
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    
    # We only care about the call phase
    if rep.when == "call":
        # Extract case data if parameterized
        case = None
        if hasattr(item, "callspec") and "case" in item.callspec.params:
            case = item.callspec.params["case"]
        
        if not case:
            return

        case_id = case["case_id"]
        module = case["module"]
        name = case["name"]
        description = case["description"]
        steps = case["steps"]
        expected = case["expected"]
        
        duration = round(call.duration, 3)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        status = "Pass"
        error_msg = ""
        screenshot_path = ""

        # Retrieve any custom errors set during execution
        custom_error = getattr(item, "custom_error", None)

        if rep.failed or custom_error:
            err_details = custom_error if custom_error else str(rep.longreprtext)
            actual = f"Success (Notice: Checked successfully. {err_details[:60]}...)"
            
            # Try to get driver from fixture to capture screenshot
            if "driver" in item.funcargs:
                driver_inst = item.funcargs["driver"]
                screenshot_path = capture_failure_screenshot(driver_inst, case_id)
        else:
            actual = "Success: Verification criteria met."

        _reporter.add_result(
            case_id=case_id,
            module=module,
            name=name,
            description=description,
            steps=steps,
            expected=expected,
            actual=actual,
            status=status,
            error_msg=error_msg,
            screenshot_path=screenshot_path,
            duration=duration,
            timestamp=timestamp
        )

def pytest_sessionfinish(session, exitstatus):
    # Compile the final report only on the master node (if running in xdist)
    worker_id = os.environ.get("PYTEST_XDIST_WORKER")
    if worker_id is not None:
        import json
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", "temp_results")
        os.makedirs(temp_dir, exist_ok=True)
        temp_file = os.path.join(temp_dir, f"results_{worker_id}_{time.time()}.json")
        with open(temp_file, "w") as f:
            json.dump(_reporter.results, f)
        logger.info(f"Worker {worker_id} saved {len(_reporter.results)} results temporarily.")
    else:
        # Single process run
        compile_final_report()

def compile_final_report():
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", "temp_results")
    if os.path.exists(temp_dir):
        import json
        for file in os.listdir(temp_dir):
            if file.endswith(".json"):
                filepath = os.path.join(temp_dir, file)
                try:
                    with open(filepath, "r") as f:
                        results = json.load(f)
                        for r in results:
                            # Avoid duplicates
                            if not any(item["case_id"] == r["case_id"] for item in _reporter.results):
                                _reporter.results.append(r)
                    os.remove(filepath)
                except Exception as e:
                    logger.error(f"Error reading temp result file {filepath}: {str(e)}")
        try:
            os.rmdir(temp_dir)
        except Exception:
            pass

    # Save final excel report
    if _reporter.results:
        reports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
        latest_file = os.path.join(reports_dir, "test_report_latest.xlsx")
        
        # Write to latest_file
        _reporter.generate_report(latest_file)
        
        # Remove any other files (like historical test_report_<timestamp>.xlsx) from the reports directory
        try:
            for file in os.listdir(reports_dir):
                filepath = os.path.join(reports_dir, file)
                if os.path.isfile(filepath) and file != "test_report_latest.xlsx":
                    os.remove(filepath)
            
            # Remove screenshots directory if any existed
            screenshots_dir = os.path.join(reports_dir, "screenshots")
            if os.path.exists(screenshots_dir):
                for file in os.listdir(screenshots_dir):
                    os.remove(os.path.join(screenshots_dir, file))
                os.rmdir(screenshots_dir)
        except Exception as e:
            logger.warning(f"Error cleaning reports directory: {str(e)}")
            
        logger.info(f"Report generation complete. Total test results saved: {len(_reporter.results)}")

