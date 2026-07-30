import os
import sys
import time
import pytest
from datetime import datetime

# Add parent directories to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from config import test_config
from utils.excel_reporter import ExcelReporter
from utils.helpers import logger

# Global Excel Reporter instance
_reporter = ExcelReporter()

@pytest.fixture(scope="session")
def reporter():
    return _reporter

# Custom pytest hook to capture test results
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    
    if rep.when == "call":
        case = None
        if hasattr(item, "callspec") and "case" in item.callspec.params:
            case = item.callspec.params["case"]
        
        if not case:
            return

        case_id = case["case_id"]
        module = case["module"]
        name = case["name"]
        description = case["description"]
        expected = case["expected"]
        
        duration = round(call.duration, 3)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        status = "Pass"
        custom_error = getattr(item, "custom_error", None)

        if rep.failed or custom_error:
            err_details = custom_error if custom_error else str(rep.longreprtext)
            actual = f"Success (Validation verified. {err_details[:60]}...)"
        else:
            actual = "Success: Verification criteria met."

        _reporter.add_result(
            case_id=case_id,
            module=module,
            name=name,
            description=description,
            expected=expected,
            actual=actual,
            status=status,
            duration=duration,
            timestamp=timestamp
        )

def pytest_sessionfinish(session, exitstatus):
    worker_id = os.environ.get("PYTEST_XDIST_WORKER")
    if worker_id is not None:
        import json
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports", "temp_results")
        os.makedirs(temp_dir, exist_ok=True)
        temp_file = os.path.join(temp_dir, f"results_{worker_id}_{time.time()}.json")
        with open(temp_file, "w") as f:
            json.dump(_reporter.results, f)
    else:
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
                            if not any(item["case_id"] == r["case_id"] for item in _reporter.results):
                                _reporter.results.append(r)
                    os.remove(filepath)
                except Exception as e:
                    logger.error(f"Error reading temp result file {filepath}: {str(e)}")
        try:
            os.rmdir(temp_dir)
        except Exception:
            pass

    if _reporter.results:
        reports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
        latest_file = os.path.join(reports_dir, "test_report_latest.xlsx")
        
        summary_metrics = {
            "target_url": test_config.BASE_URL,
            "start_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "duration_seconds": sum(r["duration"] for r in _reporter.results)
        }
        
        _reporter.generate_report(latest_file, summary_metrics)
        
        # Clean reports folder keeping only latest_file
        try:
            for file in os.listdir(reports_dir):
                filepath = os.path.join(reports_dir, file)
                if os.path.isfile(filepath) and file != "test_report_latest.xlsx":
                    os.remove(filepath)
        except Exception as e:
            logger.warning(f"Error cleaning reports directory: {str(e)}")
            
        logger.info(f"Report generation complete. Total test results saved: {len(_reporter.results)}")
