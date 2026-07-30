# GapLogic Selenium Test Automation Suite

A scalable, data-driven test automation suite built with Python, Selenium, Pytest, and OpenPyXL to execute 400 test cases for the GapLogic web application. It includes structured Page Object Models (POM), parallel execution, and styled Excel spreadsheet reporting.

## Features

- **400 Data-Driven Test Cases**: Dynamic test parameterization loaded from an Excel file (`data/test_data.xlsx`).
- **Page Object Model (POM)**: Maintained page interfaces for login, registration, dashboard modeler, and analytics views.
- **High-Performance Execution**: Powered by `pytest-xdist` for parallel browser worker threads.
- **Instantly Injected Authentication**: Custom session token caching bypasses E2E auth steps for speed.
- **Rich Excel Reporting**: Automatically styled test report spreadsheets with:
  - High-level KPI metrics cards (total, pass, fail, pass rate %, duration).
  - Status color coding (Pass = Green, Fail = Red, Skipped = Yellow).
  - Frozen header columns and auto-fitted columns.
- **Automatic Failure Screenshots**: Automatically captures and references page screenshots on test failures.

---

## Directory Structure

```
selenium_tests/
├── config/
│   └── test_config.py      # Base URL, browser selections, timeouts
├── data/
│   ├── generate_test_data.py # Test cases generator script
│   └── test_data.xlsx      # 400 parameterized test cases (generated)
├── pages/
│   ├── base_page.py        # Core Selenium action wrappers (waits, inputs, clicks)
│   ├── login_page.py       # Login selectors and actions
│   ├── register_page.py    # Registration selectors and actions
│   ├── dashboard_page.py   # Modeler form and navigation links
│   └── insights_page.py    # Analytics metrics and SVG chart hooks
├── tests/
│   └── test_suite.py       # Parameterized Pytest test execution suite
├── utils/
│   ├── helpers.py          # Loading sheets, random emails, screenshots
│   └── excel_reporter.py   # openpyxl workbook compiling and formatting
├── conftest.py             # Pytest setup fixtures, hooks, and report aggregation
├── requirements.txt        # Python library dependencies
├── README.md               # This instructions file
└── run_tests.py            # Main entry point to run the suite
```

---

## Installation & Setup

1. **Verify Python**: Ensure Python 3.8+ is installed on your system:
   ```bash
   python --version
   ```

2. **Navigate to Test Suite Folder**:
   ```bash
   cd selenium_tests
   ```

3. **Set Up Virtual Environment**:
   ```bash
   python -m venv venv
   ```

4. **Activate Virtual Environment**:
   - **Windows PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows Command Prompt (cmd)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```

5. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

---

## Test Execution

Make sure your local GapLogic development server is running (usually on `http://localhost:9002`).

### Run all tests (Parallel Mode - 4 Workers)

Run the main runner script:
```powershell
python run_tests.py
```
This script will automatically generate the 400 test cases if they do not exist, run Pytest in parallel, generate the Excel sheet, and print a console summary.

### Run in headed (Windowed) mode

To visually inspect the browser while tests run:
```powershell
python run_tests.py --headed
```

### Custom Worker Count

Adjust the worker threads using the `--workers` flag:
```powershell
python run_tests.py --workers 6
```
*(Set to `0` to disable parallel execution and run sequentially).*

### Custom Browser

To run on a different browser (Chrome is default, supports Firefox and Edge):
```powershell
python run_tests.py --browser firefox
```

### Run filtered subsets

Filter by test case name or module:
```powershell
# Run only Login cases
python run_tests.py -k "Login"

# Run a specific test case by ID
python run_tests.py -k "TC001"
```

---

## Excel Reports

Test reports are compiled in the `reports/` folder:
- **Latest Run Report**: `reports/test_report_latest.xlsx` (overwritten on each run).
- **Historical Report**: `reports/test_report_<timestamp>.xlsx` (saved per execution).

### Summary Sheet
Contains execution stats cards showing:
- Total Test Cases
- Passed Tests
- Failed Tests
- Skipped Tests
- Pass Percentage
- Total Duration

### Execution Details Sheet
Shows a granular row per test case:
- Test Case ID
- Module/Category
- Test Case Name
- Description
- Steps/Parameters
- Expected Result
- Actual Result
- Status (Pass/Fail/Skipped)
- Error Message/Stack Trace (if failed)
- Screenshot Path (if failed)
- Execution Time (seconds)
- Timestamp

---

## Adding New Test Cases

The test cases are managed in a data-driven structure. To add new test scenarios without modifying Python execution scripts:

1. Open `data/generate_test_data.py`.
2. Add your scenario specifications under the appropriate category array.
3. Run the generator:
   ```bash
   python data/generate_test_data.py
   ```
This updates `data/test_data.xlsx`. The pytest parameterization automatically loads the new cases on the next test run.
