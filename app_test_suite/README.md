# Automated API & Robustness QA Test Suite

This suite contains data-driven robustness checks (400 cases) to verify input validation boundaries, access control redirects, and database error containment for the application.

---

## 📂 Project Folder Structure

```
app_test_suite/
  ├── config/            → test_config.py (URL, timeouts)
  ├── data/              → generate_test_data.py, test_data.xlsx (400 QA cases parameters)
  ├── pages/             → POM layouts (if applicable)
  ├── tests/             → test_api_robustness.py (pytest API validations)
  ├── utils/             → excel_reporter.py, helpers.py (reporting and loading tools)
  ├── reports/           → test_report_latest.xlsx (single-sheet formatted KPIs and details logs)
  ├── requirements.txt   → pip dependencies
  ├── conftest.py        → pytest fixtures and compile hooks
  └── run_tests.py       → Entry execution orchestrator
```

---

## 🛠️ How to Run

1. Open a PowerShell terminal.
2. Navigate to the `app_test_suite` folder.
3. Run the orchestrator script:
```powershell
python run_tests.py
```

The runner automatically resolves dependencies globally (`python -m pip install --user`), triggers the 400 test cases in parallel (`pytest-xdist`), and compiles the final single-sheet metrics spreadsheet at:
`app_test_suite/reports/test_report_latest.xlsx`

---

## 📝 How to Add New Test Cases

The suite is **data-driven**: you can append new test parameters directly to `data/test_data.xlsx` or modify the categories distribution inside `data/generate_test_data.py`. Pytest will automatically pick them up on the next execution!
