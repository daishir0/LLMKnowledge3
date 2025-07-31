#!/usr/bin/env python3
"""
Directory Processing Test for LLMKnowledge3 - Scenario 4 Extension
Tests recursive directory processing for security assessment
"""

import requests
import json
import os
import tempfile
import shutil
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DirectoryProcessingTester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        
    def authenticate_admin(self) -> bool:
        """Authenticate as admin user"""
        try:
            response = self.session.post(f"{self.base_url}/auth/login", data={
                "username": "admin",
                "password": "admin123"
            })
            if response.status_code == 200:
                self.admin_token = response.json()["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                logger.info("Admin authentication successful")
                return True
            else:
                logger.error(f"Admin authentication failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Admin authentication error: {e}")
            return False
    
    def create_test_directory_structure(self) -> str:
        """Create a test directory with various file types"""
        temp_dir = tempfile.mkdtemp(prefix="llmknowledge_test_")
        logger.info(f"Created test directory: {temp_dir}")
        
        subdirs = ["documents", "reports", "personal", "public", "confidential"]
        for subdir in subdirs:
            os.makedirs(os.path.join(temp_dir, subdir), exist_ok=True)
        
        test_files = {
            "documents/company_policy.txt": "Company policy document - public information about workplace guidelines and procedures.",
            "documents/technical_spec.txt": "Technical specifications containing proprietary algorithms and trade secrets.",
            "reports/financial_summary.txt": "Q3 Financial Summary - CONFIDENTIAL - Revenue: $2.5M, Profit: $500K, Strategic partnerships.",
            "reports/public_announcement.txt": "Public announcement about new product launch scheduled for next quarter.",
            "personal/employee_records.txt": "Employee: John Smith, SSN: 123-45-6789, Address: 123 Main St, Phone: 555-0123",
            "personal/hr_notes.txt": "HR Interview notes for candidate Jane Doe, salary negotiation: $85K, background check pending.",
            "public/marketing_materials.txt": "Marketing brochure content for public distribution and website publication.",
            "public/user_manual.txt": "User manual and documentation for public release with product.",
            "confidential/security_audit.txt": "Security audit report - CONFIDENTIAL - Vulnerabilities found in systems A, B, C.",
            "confidential/legal_contracts.txt": "Legal contracts with client ABC Corp, terms and conditions, pricing: $100K annually.",
            "documents/meeting_notes.txt": "Meeting notes from board meeting discussing merger with XYZ Company - CONFIDENTIAL.",
            "reports/customer_feedback.txt": "Customer feedback containing names, email addresses, and personal opinions about products.",
            "personal/salary_data.txt": "Employee salary data: John Smith $75K, Jane Doe $80K, Bob Johnson $90K.",
            "public/press_release.txt": "Press release announcing partnership with major technology company.",
            "confidential/source_code.txt": "Proprietary source code for core algorithm - TRADE SECRET - Do not distribute."
        }
        
        for file_path, content in test_files.items():
            full_path = os.path.join(temp_dir, file_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w') as f:
                f.write(content)
        
        logger.info(f"Created {len(test_files)} test files in directory structure")
        return temp_dir
    
    def process_directory_recursively(self, directory_path: str) -> bool:
        """Process all files in directory recursively"""
        try:
            response = self.session.post(f"{self.base_url}/groups", json={
                "name": f"Directory Security Scan - {os.path.basename(directory_path)}",
                "description": f"Recursive security assessment of all files in {directory_path}"
            })
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to create group: {response.status_code}")
                return False
            
            group_id = response.json()["id"]
            logger.info(f"Created group with ID: {group_id}")
            
            prompts = [
                ("PII Detection", "Scan this file for personally identifiable information (PII) including names, SSNs, addresses, phone numbers, emails. Rate risk as HIGH/MEDIUM/LOW.", "plain_to_knowledge"),
                ("Confidentiality Level", "Determine the confidentiality level of this file: PUBLIC, INTERNAL, CONFIDENTIAL, or RESTRICTED.", "plain_to_knowledge"),
                ("External Sharing Safety", "Assess if this file is safe for external sharing. Identify any content that should be redacted.", "plain_to_knowledge"),
                ("Compliance Risk", "Evaluate compliance risks related to data protection regulations (GDPR, CCPA, HIPAA).", "plain_to_knowledge"),
                ("Security Classification", "Provide overall security classification and handling recommendations for this file.", "plain_to_knowledge")
            ]
            
            prompt_ids = []
            for name, content, category in prompts:
                response = self.session.post(f"{self.base_url}/prompts", json={
                    "name": name,
                    "content": content,
                    "category": category
                })
                if response.status_code in [200, 201]:
                    prompt_id = response.json()["id"]
                    prompt_ids.append(prompt_id)
                    
                    assoc_response = self.session.post(f"{self.base_url}/groups/{group_id}/prompts/{prompt_id}")
                    if assoc_response.status_code not in [200, 201]:
                        logger.warning(f"Failed to associate prompt {prompt_id} with group {group_id}: {assoc_response.status_code}")
            
            processed_files = 0
            for root, dirs, files in os.walk(directory_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, directory_path)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                        
                        response = self.session.post(f"{self.base_url}/records", json={
                            "group_id": group_id,
                            "title": f"File: {relative_path}",
                            "content": content,
                            "file_type": "text"
                        })
                        
                        if response.status_code in [200, 201]:
                            processed_files += 1
                            logger.info(f"Processed file: {relative_path}")
                        else:
                            logger.warning(f"Failed to process file {relative_path}: {response.status_code}")
                    
                    except Exception as e:
                        logger.warning(f"Error reading file {file_path}: {e}")
            
            logger.info(f"Processed {processed_files} files from directory")
            
            response = self.session.post(f"{self.base_url}/tasks/bulk/group/{group_id}")
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to create task: {response.status_code}")
                return False
            
            result = response.json()
            logger.info(f"Created bulk tasks for group {group_id}: {result['message']}")
            
            import time
            max_wait = 600  # 10 minutes for directory processing
            start_time = time.time()
            
            while time.time() - start_time < max_wait:
                response = self.session.get(f"{self.base_url}/tasks/status")
                if response.status_code == 200:
                    status = response.json()
                    if status["pending_tasks"] == 0:
                        logger.info("Directory processing completed")
                        break
                    else:
                        logger.info(f"Processing... {status['pending_tasks']} tasks remaining")
                        time.sleep(15)
                else:
                    logger.error(f"Task status check failed: {response.status_code}")
                    time.sleep(10)
            else:
                logger.error("Directory processing timed out")
                return False
            
            response = self.session.get(f"{self.base_url}/matrix/legacy", params={"group_ids": str(group_id)})
            if response.status_code == 200:
                matrix = response.json()
                logger.info(f"Generated knowledge matrix with {matrix['total_count']} items")
                
                response = self.session.get(f"{self.base_url}/matrix/legacy/export/excel", params={"group_ids": str(group_id)})
                if response.status_code == 200:
                    filename = f"directory_security_scan_{int(time.time())}.xlsx"
                    with open(filename, 'wb') as f:
                        f.write(response.content)
                    logger.info(f"Security scan results exported to {filename}")
                    return True
                else:
                    logger.error(f"Failed to export results: {response.status_code}")
                    return False
            else:
                logger.error(f"Failed to get matrix: {response.status_code}")
                return False
        
        except Exception as e:
            logger.error(f"Directory processing error: {e}")
            return False
    
    def run_directory_test(self) -> bool:
        """Run the complete directory processing test"""
        logger.info("Starting directory processing test")
        
        if not self.authenticate_admin():
            return False
        
        test_dir = self.create_test_directory_structure()
        
        try:
            success = self.process_directory_recursively(test_dir)
            
            if success:
                logger.info("✅ Directory processing test completed successfully")
            else:
                logger.error("❌ Directory processing test failed")
            
            return success
        
        finally:
            try:
                shutil.rmtree(test_dir)
                logger.info(f"Cleaned up test directory: {test_dir}")
            except Exception as e:
                logger.warning(f"Failed to cleanup test directory: {e}")

def main():
    """Main test execution"""
    print("LLMKnowledge3 Directory Processing Test")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:8000/healthz")
        if response.status_code != 200:
            print("❌ Backend is not running or not healthy")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at http://localhost:8000")
        return False
    
    print("✅ Backend is running and healthy")
    
    tester = DirectoryProcessingTester()
    success = tester.run_directory_test()
    
    if success:
        print("\n🎉 Directory processing test passed!")
        return True
    else:
        print("\n❌ Directory processing test failed.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
