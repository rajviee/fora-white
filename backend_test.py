#!/usr/bin/env python3
"""
ForaTask Multi-tenant SaaS Backend API Testing Suite
Tests all critical endpoints for subscription management, authentication, and master admin functionality.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time

class ForaTaskAPITester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        # Test data
        self.test_company_data = {
            "email": f"testuser_{int(time.time())}@example.com",
            "password": "TestPass123!",
            "firstName": "Test",
            "lastName": "User",
            "contactNumber": "+919876543210",
            "dateOfBirth": "1990-01-01",
            "gender": "male",
            "designation": "CEO",
            "companyEmail": f"company_{int(time.time())}@example.com",
            "companyName": f"Test Company {int(time.time())}",
            "companyContactNumber": "+919876543210",
            "companyAddress": "123 Test Street, Test City"
        }
        
        self.master_admin_credentials = {
            "email": "admin@foratask.com",
            "password": "Varient23@123"
        }
        
        # Tokens
        self.user_token = None
        self.master_admin_token = None
        self.company_id = None
        self.subscription_id = None
        
        # Test results
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []

    def log_test(self, test_name, success, response_data=None, error_msg=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(test_name)
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append({
                "test": test_name,
                "error": error_msg,
                "response": response_data
            })
            print(f"❌ {test_name} - FAILED: {error_msg}")

    def make_request(self, method, endpoint, data=None, headers=None, auth_token=None):
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}/{endpoint}"
        
        request_headers = self.session.headers.copy()
        if headers:
            request_headers.update(headers)
        if auth_token:
            request_headers['Authorization'] = f'Bearer {auth_token}'
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=request_headers, params=data, timeout=10)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=request_headers, timeout=10)
            elif method.upper() == 'PATCH':
                response = self.session.patch(url, json=data, headers=request_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error for {method} {url}: {e}")
            return None

    def test_company_registration(self):
        """Test POST /auth/register - Company registration with automatic subscription creation"""
        print("\n🔍 Testing Company Registration...")
        
        response = self.make_request('POST', 'auth/register', self.test_company_data)
        
        if not response:
            self.log_test("Company Registration", False, error_msg="Request failed")
            return False
        
        if response.status_code == 201:
            data = response.json()
            if 'userId' in data and 'companyId' in data and 'subscriptionId' in data:
                self.company_id = data['companyId']
                self.subscription_id = data['subscriptionId']
                self.log_test("Company Registration", True, data)
                return True
            else:
                self.log_test("Company Registration", False, data, "Missing required fields in response")
                return False
        else:
            self.log_test("Company Registration", False, response.json() if response.content else None, 
                         f"Status code: {response.status_code}")
            return False

    def test_user_login(self):
        """Test POST /auth/login - User login with subscription status"""
        print("\n🔍 Testing User Login...")
        
        login_data = {
            "email": self.test_company_data["email"],
            "password": self.test_company_data["password"]
        }
        
        response = self.make_request('POST', 'auth/login', login_data)
        
        if not response:
            self.log_test("User Login", False, error_msg="Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'token' in data and 'subscription' in data:
                self.user_token = data['token']
                subscription = data['subscription']
                if subscription and 'status' in subscription and 'planType' in subscription:
                    self.log_test("User Login", True, data)
                    return True
                else:
                    self.log_test("User Login", False, data, "Missing subscription info")
                    return False
            else:
                self.log_test("User Login", False, data, "Missing token or subscription")
                return False
        else:
            self.log_test("User Login", False, response.json() if response.content else None,
                         f"Status code: {response.status_code}")
            return False

    def test_price_calculator(self):
        """Test GET /payment/calculate-price - Price calculator for different user counts"""
        print("\n🔍 Testing Price Calculator...")
        
        test_cases = [1, 3, 5, 7, 10, 15]
        all_passed = True
        
        for user_count in test_cases:
            response = self.make_request('GET', f'payment/calculate-price?userCount={user_count}')
            
            if not response:
                self.log_test(f"Price Calculator (users: {user_count})", False, error_msg="Request failed")
                all_passed = False
                continue
            
            if response.status_code == 200:
                data = response.json()
                if 'success' in data and data['success'] and 'pricing' in data:
                    pricing = data['pricing']
                    expected_amount = 249 if user_count <= 5 else 249 + ((user_count - 5) * 50)
                    if pricing['totalAmount'] == expected_amount:
                        self.log_test(f"Price Calculator (users: {user_count})", True, pricing)
                    else:
                        self.log_test(f"Price Calculator (users: {user_count})", False, pricing,
                                    f"Expected {expected_amount}, got {pricing['totalAmount']}")
                        all_passed = False
                else:
                    self.log_test(f"Price Calculator (users: {user_count})", False, data, "Invalid response format")
                    all_passed = False
            else:
                self.log_test(f"Price Calculator (users: {user_count})", False, 
                            response.json() if response.content else None,
                            f"Status code: {response.status_code}")
                all_passed = False
        
        return all_passed

    def test_master_admin_login(self):
        """Test POST /master-admin/login - Master admin authentication"""
        print("\n🔍 Testing Master Admin Login...")
        
        response = self.make_request('POST', 'master-admin/login', self.master_admin_credentials)
        
        if not response:
            self.log_test("Master Admin Login", False, error_msg="Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'success' in data and data['success'] and 'token' in data:
                self.master_admin_token = data['token']
                self.log_test("Master Admin Login", True, data)
                return True
            else:
                self.log_test("Master Admin Login", False, data, "Missing token or success flag")
                return False
        else:
            self.log_test("Master Admin Login", False, response.json() if response.content else None,
                         f"Status code: {response.status_code}")
            return False

    def test_master_admin_dashboard(self):
        """Test GET /master-admin/dashboard - Dashboard statistics"""
        print("\n🔍 Testing Master Admin Dashboard...")
        
        if not self.master_admin_token:
            self.log_test("Master Admin Dashboard", False, error_msg="No master admin token")
            return False
        
        response = self.make_request('GET', 'master-admin/dashboard', auth_token=self.master_admin_token)
        
        if not response:
            self.log_test("Master Admin Dashboard", False, error_msg="Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'success' in data and data['success'] and 'stats' in data:
                stats = data['stats']
                required_fields = ['totalCompanies', 'totalUsers', 'subscriptions', 'mrr']
                if all(field in stats for field in required_fields):
                    self.log_test("Master Admin Dashboard", True, stats)
                    return True
                else:
                    missing = [f for f in required_fields if f not in stats]
                    self.log_test("Master Admin Dashboard", False, stats, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Master Admin Dashboard", False, data, "Invalid response format")
                return False
        else:
            self.log_test("Master Admin Dashboard", False, response.json() if response.content else None,
                         f"Status code: {response.status_code}")
            return False

    def test_master_admin_companies_list(self):
        """Test GET /master-admin/companies - List all companies"""
        print("\n🔍 Testing Master Admin Companies List...")
        
        if not self.master_admin_token:
            self.log_test("Master Admin Companies List", False, error_msg="No master admin token")
            return False
        
        response = self.make_request('GET', 'master-admin/companies', auth_token=self.master_admin_token)
        
        if not response:
            self.log_test("Master Admin Companies List", False, error_msg="Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'success' in data and data['success'] and 'companies' in data:
                companies = data['companies']
                if isinstance(companies, list):
                    self.log_test("Master Admin Companies List", True, f"Found {len(companies)} companies")
                    return True
                else:
                    self.log_test("Master Admin Companies List", False, data, "Companies is not a list")
                    return False
            else:
                self.log_test("Master Admin Companies List", False, data, "Invalid response format")
                return False
        else:
            self.log_test("Master Admin Companies List", False, response.json() if response.content else None,
                         f"Status code: {response.status_code}")
            return False

    def test_master_admin_company_details(self):
        """Test GET /master-admin/companies/:companyId - Company details"""
        print("\n🔍 Testing Master Admin Company Details...")
        
        if not self.master_admin_token or not self.company_id:
            self.log_test("Master Admin Company Details", False, 
                         error_msg="No master admin token or company ID")
            return False
        
        response = self.make_request('GET', f'master-admin/companies/{self.company_id}', 
                                   auth_token=self.master_admin_token)
        
        if not response:
            self.log_test("Master Admin Company Details", False, error_msg="Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'success' in data and data['success'] and 'company' in data and 'subscription' in data:
                self.log_test("Master Admin Company Details", True, data)
                return True
            else:
                self.log_test("Master Admin Company Details", False, data, "Invalid response format")
                return False
        else:
            self.log_test("Master Admin Company Details", False, response.json() if response.content else None,
                         f"Status code: {response.status_code}")
            return False

    def test_extend_trial(self):
        """Test POST /master-admin/companies/:companyId/extend-trial - Extend trial period"""
        print("\n🔍 Testing Extend Trial...")
        
        if not self.master_admin_token or not self.company_id:
            self.log_test("Extend Trial", False, error_msg="No master admin token or company ID")
            return False
        
        extend_data = {"days": 30}
        response = self.make_request('POST', f'master-admin/companies/{self.company_id}/extend-trial',
                                   data=extend_data, auth_token=self.master_admin_token)
        
        if not response:
            self.log_test("Extend Trial", False, error_msg="Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'success' in data and data['success']:
                self.log_test("Extend Trial", True, data)
                return True
            else:
                self.log_test("Extend Trial", False, data, "Success flag not true")
                return False
        else:
            self.log_test("Extend Trial", False, response.json() if response.content else None,
                         f"Status code: {response.status_code}")
            return False

    def test_restrict_company(self):
        """Test POST /master-admin/companies/:companyId/restrict - Restrict company access"""
        print("\n🔍 Testing Restrict Company...")
        
        if not self.master_admin_token or not self.company_id:
            self.log_test("Restrict Company", False, error_msg="No master admin token or company ID")
            return False
        
        restrict_data = {"reason": "Test restriction"}
        response = self.make_request('POST', f'master-admin/companies/{self.company_id}/restrict',
                                   data=restrict_data, auth_token=self.master_admin_token)
        
        if not response:
            self.log_test("Restrict Company", False, error_msg="Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'success' in data and data['success']:
                self.log_test("Restrict Company", True, data)
                return True
            else:
                self.log_test("Restrict Company", False, data, "Success flag not true")
                return False
        else:
            self.log_test("Restrict Company", False, response.json() if response.content else None,
                         f"Status code: {response.status_code}")
            return False

    def test_unrestrict_company(self):
        """Test POST /master-admin/companies/:companyId/unrestrict - Unrestrict company access"""
        print("\n🔍 Testing Unrestrict Company...")
        
        if not self.master_admin_token or not self.company_id:
            self.log_test("Unrestrict Company", False, error_msg="No master admin token or company ID")
            return False
        
        response = self.make_request('POST', f'master-admin/companies/{self.company_id}/unrestrict',
                                   auth_token=self.master_admin_token)
        
        if not response:
            self.log_test("Unrestrict Company", False, error_msg="Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'success' in data and data['success']:
                self.log_test("Unrestrict Company", True, data)
                return True
            else:
                self.log_test("Unrestrict Company", False, data, "Success flag not true")
                return False
        else:
            self.log_test("Unrestrict Company", False, response.json() if response.content else None,
                         f"Status code: {response.status_code}")
            return False

    def test_subscription_status(self):
        """Test GET /payment/subscription-status - Get current subscription status"""
        print("\n🔍 Testing Subscription Status...")
        
        if not self.user_token:
            self.log_test("Subscription Status", False, error_msg="No user token")
            return False
        
        response = self.make_request('GET', 'payment/subscription-status', auth_token=self.user_token)
        
        if not response:
            self.log_test("Subscription Status", False, error_msg="Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if 'success' in data and data['success'] and 'subscription' in data:
                subscription = data['subscription']
                required_fields = ['status', 'planType', 'currentUserCount', 'totalAmount']
                if all(field in subscription for field in required_fields):
                    self.log_test("Subscription Status", True, subscription)
                    return True
                else:
                    missing = [f for f in required_fields if f not in subscription]
                    self.log_test("Subscription Status", False, subscription, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Subscription Status", False, data, "Invalid response format")
                return False
        else:
            self.log_test("Subscription Status", False, response.json() if response.content else None,
                         f"Status code: {response.status_code}")
            return False

    def test_payment_creation_503(self):
        """Test that payment creation returns 503 due to unconfigured Razorpay keys"""
        print("\n🔍 Testing Payment Creation (Expected 503)...")
        
        if not self.user_token:
            self.log_test("Payment Creation 503", False, error_msg="No user token")
            return False
        
        payment_data = {"userCount": 5}
        
        # Make direct request to avoid session issues
        try:
            response = requests.post(
                f"{self.base_url}/payment/create-order",
                json=payment_data,
                headers={
                    'Authorization': f'Bearer {self.user_token}',
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
        except requests.exceptions.RequestException as e:
            self.log_test("Payment Creation 503", False, error_msg=f"Request exception: {str(e)}")
            return False
        
        if response.status_code == 503:
            data = response.json()
            if 'message' in data and 'not configured' in data['message'].lower():
                self.log_test("Payment Creation 503", True, data)
                return True
            else:
                self.log_test("Payment Creation 503", False, data, "Unexpected 503 message")
                return False
        elif response.status_code == 401:
            # Authentication issue - this is expected if token is invalid
            self.log_test("Payment Creation 503", False, response.json() if response.content else None,
                         f"Authentication failed - token may be invalid")
            return False
        else:
            self.log_test("Payment Creation 503", False, response.json() if response.content else None,
                         f"Expected 503, got {response.status_code}")
            return False

    def test_task_completion_history(self):
        """Test GET /task/:id/history - Get recurring task completion history"""
        print("\n🔍 Testing Task Completion History...")
        
        if not self.user_token:
            self.log_test("Task Completion History", False, error_msg="No user token")
            return False
        
        # Use a dummy task ID since we don't have tasks created in this test
        # This will test the endpoint structure and authentication
        dummy_task_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format
        
        # Debug: Test with direct request to see what's happening
        try:
            response = requests.get(
                f"{self.base_url}/task/{dummy_task_id}/history",
                headers={
                    'Authorization': f'Bearer {self.user_token}',
                    'Content-Type': 'application/json'
                },
                timeout=10
            )
        except requests.exceptions.RequestException as e:
            self.log_test("Task Completion History", False, error_msg=f"Request exception: {str(e)}")
            return False
        
        # We expect either 200 with empty array or 404 for non-existent task
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Task Completion History", True, f"History endpoint working, returned {len(data)} records")
                return True
            else:
                self.log_test("Task Completion History", False, data, "Response is not an array")
                return False
        elif response.status_code == 404:
            # This is acceptable for a non-existent task
            self.log_test("Task Completion History", True, "Endpoint working (404 for non-existent task)")
            return True
        elif response.status_code == 401:
            self.log_test("Task Completion History", False, response.json() if response.content else None,
                         "Authentication failed - check token validity")
            return False
        else:
            self.log_test("Task Completion History", False, response.json() if response.content else None,
                         f"Unexpected status code: {response.status_code}")
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting ForaTask Backend API Tests...")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_company_registration,
            self.test_user_login,
            self.test_price_calculator,
            self.test_master_admin_login,
            self.test_master_admin_dashboard,
            self.test_master_admin_companies_list,
            self.test_master_admin_company_details,
            self.test_extend_trial,
            self.test_restrict_company,
            self.test_unrestrict_company,
            self.test_subscription_status,
            self.test_task_completion_history,
            self.test_payment_creation_503
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_test(test.__name__, False, error_msg=f"Exception: {str(e)}")
            
            # Small delay between tests
            time.sleep(0.5)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  - {failure['test']}: {failure['error']}")
        
        if self.passed_tests:
            print("\n✅ PASSED TESTS:")
            for test in self.passed_tests:
                print(f"  - {test}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = ForaTaskAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())