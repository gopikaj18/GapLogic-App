# Appium E2E Mobile Test Automation Suite

This suite contains large-scale, data-driven E2E automation tests (400 cases) for the native Android WebView wrapper of the GapLogic mobile application.

---

## 🚀 Environment Prerequisites

### 1. Android Studio & Emulator Setup
- Install **Android Studio**.
- Add the Android SDK platform tool directories to your system environment `PATH` (e.g. `C:\Users\<user>\AppData\Local\Android\Sdk\platform-tools`).
- Open **Virtual Device Manager** in Android Studio and start an emulator (e.g., Pixel 6 - Android 13).

### 2. Node & Appium Server Setup
Install the global Appium server and Android driver:
```bash
# Install Appium
npm install -g appium

# Install UiAutomator2 driver for Android
appium driver install uiautomator2
```

---

## 📂 Project Folder Structure

```
appium-tests/
  ├── config/            → device_config.py (capabilities, mock mode settings)
  ├── data/              → generate_test_data.py, test_data.xlsx (400 parameterized cases)
  ├── pages/             → Page Object Model screens (base, splash, auth, dashboard, insights)
  ├── tests/             → test_mobile_suite.py (pytest runner)
  ├── utils/             → excel_reporter.py, helpers.py (screenshots and parsing)
  ├── reports/           → test_report_latest.xlsx (single-sheet formatted summary log)
  ├── requirements.txt   → pip dependencies
  ├── conftest.py        → Appium driver fixtures and capture hooks
  └── run_tests.py       → Command-line entry point
```

---

## ⚙️ Capabilities & Failsafe Execution Mode

The suite supports a **Dual-Mode Execution** model configured inside `config/device_config.py`:
1. **Mock Mode (Default: `MOCK_MODE = True`)**: If no Appium Server or Android emulator is active on the host machine, the test execution will automatically launch using a simulated mock webdriver. This runs all 400 test cases instantly and generates the final styled Excel report without environment requirements.
2. **Active Mode (`MOCK_MODE = False`)**: Starts the global Appium client, connects to `http://localhost:4723`, loads the APK `apks/gaplogic-debug.apk`, and drives E2E gestures inside the emulator.

---

## 🛠️ How to Run

1. Open a PowerShell terminal.
2. Navigate to the `appium-tests` folder.
3. Run the orchestrator script:
```powershell
python run_tests.py
```

This will automatically configure global dependencies via pip (`python -m pip install --user`), run all 400 cases in parallel with 4 workers (`pytest-xdist`), and output the final single-sheet summary log at:
`appium-tests/reports/test_report_latest.xlsx`

---

## 📝 How to Add New Test Cases

The suite is **data-driven**: you can append new test parameters directly to `data/test_data.xlsx` or modify the generator configuration inside `data/generate_test_data.py`. Pytest will automatically pick them up on the next execution!
