#!/usr/bin/env python3
"""
Master Test Runner Script for Laxou Map Interactive Map E2E Playwright Tests.
Orchestrates execution of Tier 1, Tier 2, Tier 3, and Tier 4 test suites.
Formats clean ANSI-colored console output by tier, reports overall pass/fail status,
and returns exit code 0 if all tests pass.
"""

import os
import sys
import time
import unittest

# ANSI Color Codes
COLOR_HEADER = "\033[1;36m"   # Cyan Bold
COLOR_TIER = "\033[1;35m"     # Magenta Bold
COLOR_PASS = "\033[1;32m"     # Green Bold
COLOR_FAIL = "\033[1;31m"     # Red Bold
COLOR_WARN = "\033[1;33m"     # Yellow Bold
COLOR_INFO = "\033[0;37m"     # Gray/White
COLOR_RESET = "\033[0m"       # Reset

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

def flatten_suite(suite):
    tests = []
    for item in suite:
        if isinstance(item, unittest.TestSuite):
            tests.extend(flatten_suite(item))
        else:
            tests.append(item)
    return tests

def run_suite(tier_name, module_name):
    """
    Load and execute a specific test module, formatting colored output per test.
    Returns (passed_count, failed_count, error_count, duration, total_tests).
    """
    print(f"\n{COLOR_TIER}{'=' * 75}{COLOR_RESET}")
    print(f"{COLOR_TIER} RUNNING {tier_name} ({module_name}){COLOR_RESET}")
    print(f"{COLOR_TIER}{'=' * 75}{COLOR_RESET}\n")

    loader = unittest.TestLoader()
    raw_suite = loader.loadTestsFromName(module_name)
    test_cases = flatten_suite(raw_suite)

    start_time = time.time()
    
    # Custom runner capturing results
    result = unittest.TestResult()
    
    for test in test_cases:
        test_name = test._testMethodName
        test_doc = test._testMethodDoc or test_name
        test_doc_clean = test_doc.split("\n")[0].strip()
        
        test_start = time.time()
        test.run(result)
        test_duration = time.time() - test_start

        # Determine if test passed or failed in this run step
        failures_before = len(result.failures)
        errors_before = len(result.errors)
        
        # Check current status
        last_failure = result.failures[-1] if len(result.failures) > 0 and result.failures[-1][0] == test else None
        last_error = result.errors[-1] if len(result.errors) > 0 and result.errors[-1][0] == test else None

        if last_failure or last_error:
            print(f"  {COLOR_FAIL}✖ FAIL{COLOR_RESET} [{test_duration:.2f}s] {test_name}: {test_doc_clean}", flush=True)
            if last_failure:
                err_msg = str(last_failure[1]).split("\n")[-2] if "\n" in str(last_failure[1]) else str(last_failure[1])
                print(f"     {COLOR_WARN}↳ {err_msg}{COLOR_RESET}", flush=True)
            if last_error:
                err_msg = str(last_error[1]).split("\n")[-2] if "\n" in str(last_error[1]) else str(last_error[1])
                print(f"     {COLOR_WARN}↳ Error: {err_msg}{COLOR_RESET}", flush=True)
        else:
            print(f"  {COLOR_PASS}✔ PASS{COLOR_RESET} [{test_duration:.2f}s] {test_name}: {test_doc_clean}", flush=True)

    duration = time.time() - start_time
    total_tests = result.testsRun
    failed_count = len(result.failures)
    error_count = len(result.errors)
    passed_count = total_tests - failed_count - error_count

    print(f"\n{COLOR_INFO}Tier Summary: {passed_count}/{total_tests} Passed | {failed_count} Failed | {error_count} Errors | {duration:.2f}s{COLOR_RESET}\n", flush=True)
    return passed_count, failed_count, error_count, duration, total_tests

def main():
    print(f"{COLOR_HEADER}")
    print(" ╔═════════════════════════════════════════════════════════════════════════╗")
    print(" ║          LAXOU MAP APP - MASTER PLAYWRIGHT E2E TEST RUNNER              ║")
    print(" ╚═════════════════════════════════════════════════════════════════════════╝")
    print(f"{COLOR_RESET}")

    total_start = time.time()

    tiers = [
        ("Tier 1: Feature Coverage (R1 - R5)", "tests.test_tier1_features"),
        ("Tier 2: Boundary & Corner Cases", "tests.test_tier2_boundaries"),
        ("Tier 3: Cross-Feature Interactions", "tests.test_tier3_interactions"),
        ("Tier 4: Real-World Workflows", "tests.test_tier4_workflows")
    ]

    tier_results = []
    total_passed = 0
    total_failed = 0
    total_errors = 0
    total_run = 0

    for tier_name, module_name in tiers:
        p, f, e, dur, run_cnt = run_suite(tier_name, module_name)
        tier_results.append({
            'name': tier_name,
            'passed': p,
            'failed': f,
            'errors': e,
            'duration': dur,
            'total': run_cnt
        })
        total_passed += p
        total_failed += f
        total_errors += e
        total_run += run_cnt

    total_duration = time.time() - total_start

    # Grand Summary Report
    print(f"\n{COLOR_HEADER}{'=' * 75}{COLOR_RESET}")
    print(f"{COLOR_HEADER} MASTER E2E TEST RUN SUMMARY REPORT{COLOR_RESET}")
    print(f"{COLOR_HEADER}{'=' * 75}{COLOR_RESET}\n")

    print(f"{'Tier Name':<42} | {'Passed':<8} | {'Failed':<8} | {'Duration':<8}")
    print("-" * 75)

    for tr in tier_results:
        status_color = COLOR_PASS if tr['failed'] == 0 and tr['errors'] == 0 else COLOR_FAIL
        print(f"{tr['name']:<42} | {status_color}{tr['passed']}/{tr['total']:<6}{COLOR_RESET} | {status_color}{tr['failed'] + tr['errors']:<8}{COLOR_RESET} | {tr['duration']:.2f}s")

    print("-" * 75)
    
    if total_failed == 0 and total_errors == 0:
        overall_status = f"{COLOR_PASS}✔ OVERALL RESULT: ALL {total_run} E2E TESTS PASSED SUCCESSFULLY!{COLOR_RESET}"
        exit_code = 0
    else:
        overall_status = f"{COLOR_FAIL}✖ OVERALL RESULT: {total_failed + total_errors} TEST(S) FAILED OUT OF {total_run}!{COLOR_RESET}"
        exit_code = 1

    print(f"\nTotal Tests Executed: {total_run}")
    print(f"Total Time Elapsed:  {total_duration:.2f} seconds")
    print(f"\n{overall_status}\n")

    sys.exit(exit_code)

if __name__ == "__main__":
    main()
