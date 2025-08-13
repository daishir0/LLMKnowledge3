#!/usr/bin/env python3
"""
Academic Assessment Test Script for LLMKnowledge3

This script automates the complete workflow for academic paper evaluation:
1. Creates a group for academic assessment
2. Uploads plain knowledge files (student papers)
3. Creates evaluation prompts (including numeric scoring)
4. Executes AI processing tasks
5. Creates a knowledge matrix definition 
6. Downloads the matrix as Excel file

Requirements: conda activate 311
"""

import requests
import json
import time
import os
import glob
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "admin"  # Change if needed
PASSWORD = "admin123"  # Change if needed

class AcademicAssessment:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.group_id = None
        self.prompt_ids = []
        
    def login(self):
        """Login and get authentication token"""
        print("🔐 Logging in...")
        
        # Login request
        response = self.session.post(
            f"{BASE_URL}/auth/login",
            data={
                "username": USERNAME,
                "password": PASSWORD
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            self.session.headers.update({
                "Authorization": f"Bearer {self.token}"
            })
            print("✅ Login successful")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    
    def create_group(self):
        """Create a group for academic assessment"""
        print("📁 Creating Academic Assessment group...")
        
        group_data = {
            "name": "Student Paper Assessment Test",
            "description": "Automated evaluation of student academic papers using multiple rubric criteria"
        }
        
        response = self.session.post(f"{BASE_URL}/groups", json=group_data)
        
        if response.status_code == 200:
            self.group_id = response.json()["id"]
            print(f"✅ Group created with ID: {self.group_id}")
            return True
        else:
            print(f"❌ Group creation failed: {response.status_code} - {response.text}")
            return False
    
    def upload_plain_knowledge(self):
        """Upload student paper markdown files"""
        print("📄 Uploading student paper files...")
        
        # Get all markdown files from plain_knowledge directory
        plain_knowledge_dir = Path(__file__).parent / "plain_knowledge"
        md_files = list(plain_knowledge_dir.glob("*.md"))
        
        if not md_files:
            print("❌ No markdown files found in plain_knowledge directory")
            return False
        
        uploaded_count = 0
        for md_file in md_files:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            record_data = {
                "title": md_file.stem.replace('_', ' ').title(),
                "content": content,
                "group_id": self.group_id
            }
            
            response = self.session.post(f"{BASE_URL}/records", json=record_data)
            
            if response.status_code == 200:
                uploaded_count += 1
                print(f"  ✅ Uploaded: {md_file.name}")
            else:
                print(f"  ❌ Failed to upload {md_file.name}: {response.text}")
        
        print(f"✅ Uploaded {uploaded_count} student paper files")
        return uploaded_count > 0
    
    def create_prompts(self):
        """Create evaluation prompts"""
        print("💭 Creating evaluation prompts...")
        
        # Get all prompt files from prompts directory
        prompts_dir = Path(__file__).parent / "prompts"
        prompt_files = list(prompts_dir.glob("*.md"))
        
        if not prompt_files:
            print("❌ No prompt files found in prompts directory")
            return False
        
        created_count = 0
        for prompt_file in prompt_files:
            with open(prompt_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract title from first line (remove # and clean up)
            lines = content.split('\n')
            title = lines[0].replace('#', '').strip()
            
            prompt_data = {
                "name": title,
                "content": content,
                "category": "Academic Assessment"
            }
            
            response = self.session.post(f"{BASE_URL}/prompts", json=prompt_data)
            
            if response.status_code == 200:
                prompt_id = response.json()["id"]
                self.prompt_ids.append(prompt_id)
                created_count += 1
                print(f"  ✅ Created prompt: {title}")
            else:
                print(f"  ❌ Failed to create prompt {title}: {response.text}")
        
        print(f"✅ Created {created_count} evaluation prompts")
        return created_count > 0
    
    def execute_tasks(self):
        """Execute AI processing tasks for the group"""
        print("🤖 Starting AI processing tasks...")
        
        # First, associate prompts with the group
        for prompt_id in self.prompt_ids:
            response = self.session.post(f"{BASE_URL}/groups/{self.group_id}/prompts/{prompt_id}")
            if response.status_code not in [200, 201]:
                print(f"  ⚠️ Failed to associate prompt {prompt_id} with group: {response.status_code}")
        
        # Start bulk task processing for the group
        response = self.session.post(f"{BASE_URL}/tasks/bulk/group/{self.group_id}")
        
        if response.status_code not in [200, 201]:
            print(f"❌ Failed to start tasks: {response.status_code} - {response.text}")
            return False
        
        print("✅ Tasks started, monitoring progress...")
        
        # Monitor task progress
        max_wait_time = 1800  # 30 minutes
        check_interval = 30   # 30 seconds
        elapsed_time = 0
        
        while elapsed_time < max_wait_time:
            # Check task status
            status_response = self.session.get(f"{BASE_URL}/tasks/status")
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                pending_tasks = status_data.get("pending_tasks", 0)
                
                print(f"  📊 Pending tasks: {pending_tasks}")
                
                if pending_tasks == 0:
                    print("✅ All tasks completed successfully!")
                    return True
            
            time.sleep(check_interval)
            elapsed_time += check_interval
        
        print("⏰ Task processing timeout reached")
        return False
    
    def create_matrix_definition(self):
        """Create a knowledge matrix definition"""
        print("📋 Creating knowledge matrix definition...")
        
        matrix_data = {
            "name": "Academic Assessment Matrix",
            "description": "Rubric-based evaluation matrix for student academic papers across multiple criteria",
            "group_ids": str(self.group_id)
        }
        
        response = self.session.post(f"{BASE_URL}/matrix/definitions", json=matrix_data)
        
        if response.status_code == 200:
            self.matrix_id = response.json()["id"]
            print(f"✅ Matrix definition created with ID: {self.matrix_id}")
            return True
        else:
            print(f"❌ Matrix creation failed: {response.status_code} - {response.text}")
            return False
    
    def download_excel(self):
        """Download the knowledge matrix as Excel file"""
        print("📥 Downloading knowledge matrix as Excel...")
        
        # Download with plain knowledge included
        response = self.session.get(
            f"{BASE_URL}/matrix/export/{self.matrix_id}/excel?include_plain_knowledge=true",
            stream=True
        )
        
        if response.status_code == 200:
            # Generate filename
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"academic_assessment_matrix_{timestamp}.xlsx"
            filepath = Path(__file__).parent / filename
            
            # Save the file
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print(f"✅ Excel file saved: {filename}")
            print(f"📁 Full path: {filepath.absolute()}")
            return True
        else:
            print(f"❌ Excel download failed: {response.status_code} - {response.text}")
            return False
    
    def run_complete_assessment(self):
        """Run the complete academic assessment workflow"""
        print("🚀 Starting Academic Assessment Test")
        print("=" * 50)
        
        steps = [
            ("Login", self.login),
            ("Create Group", self.create_group),
            ("Upload Student Papers", self.upload_plain_knowledge),
            ("Create Assessment Prompts", self.create_prompts),
            ("Execute AI Processing", self.execute_tasks),
            ("Create Matrix Definition", self.create_matrix_definition),
            ("Download Excel Report", self.download_excel)
        ]
        
        for step_name, step_function in steps:
            print(f"\n📌 Step: {step_name}")
            if not step_function():
                print(f"❌ Failed at step: {step_name}")
                return False
        
        print("\n" + "=" * 50)
        print("🎉 Academic Assessment Test Completed Successfully!")
        print("\nResults:")
        print(f"  • Group ID: {self.group_id}")
        print(f"  • Matrix ID: {self.matrix_id}")
        print(f"  • Prompts Created: {len(self.prompt_ids)}")
        print(f"  • Excel file saved in current directory")
        
        return True

def main():
    """Main execution function"""
    assessment = AcademicAssessment()
    
    try:
        success = assessment.run_complete_assessment()
        if success:
            print("\n✅ Test completed successfully!")
            exit(0)
        else:
            print("\n❌ Test failed!")
            exit(1)
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        exit(1)

if __name__ == "__main__":
    main()