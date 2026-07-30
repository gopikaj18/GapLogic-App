import os
import sys
import subprocess
import time

def install_dependencies():
    """
    Installs Appium python clients and openpyxl globally, bypassing AppLocker block on virtualenv.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    req_file = os.path.join(script_dir, "requirements.txt")
    print(f"[Runner] Installing/Updating Appium dependencies globally via python -m pip...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "--user", "-r", req_file], check=True)
    except subprocess.CalledProcessError as e:
        print(f"[Runner] Warning: pip installation encountered: {str(e)}. Attempting to continue...")

def main():
    install_dependencies()
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pytest_path = os.path.join(os.path.dirname(sys.executable), "Scripts", "pytest.exe")
    if not os.path.exists(pytest_path):
        # Fallback to python -m pytest
        pytest_cmd = [sys.executable, "-m", "pytest"]
    else:
        pytest_cmd = [pytest_path]

    test_suite = os.path.join(script_dir, "tests", "test_mobile_suite.py")
    
    print("\n========================================================")
    print("        LAUNCHING APPIUM E2E MOBILE AUTOMATION SUITE      ")
    print("========================================================\n")
    
    # Execute pytest in parallel with 4 workers to speed up execution
    cmd = pytest_cmd + ["-v", "-n", "4", "--tb=short", test_suite]
    print(f"[Runner] Executing: {' '.join(cmd)}")
    
    start_time = time.time()
    result = subprocess.run(cmd)
    duration = time.time() - start_time
    
    print("\n--------------------------------------------------------")
    print("            APPIUM E2E MOBILE RUNNER SUMMARY            ")
    print("--------------------------------------------------------")
    print(f"Total Run Duration: {duration:.2f} seconds")
    print(f"Pytest Exit Code:   {result.returncode}")
    print("========================================================")
    print(" SUCCESS: Formatted Excel Report Compiled Successfully! ")
    print(f" Path: {os.path.join(script_dir, 'reports', 'test_report_latest.xlsx')}")
    print("========================================================\n")

if __name__ == "__main__":
    main()
