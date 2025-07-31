#!/usr/bin/env python3
"""
Comprehensive test script for LLMKnowledge3 - 5 Story Scenarios
Tests all functionality via API calls with dummy data
"""

import requests
import json
import os
import time
import tempfile
from pathlib import Path
from typing import Dict, List, Any
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class LLMKnowledge3Tester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        self.user_tokens = {}
        self.test_data = {}
        
    def authenticate_admin(self) -> bool:
        """Authenticate as admin user"""
        try:
            response = self.session.post(f"{self.base_url}/auth/login", data={
                "username": "admin@example.com",
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
    
    def create_test_user(self, email: str, password: str = "testpass123") -> str:
        """Create a test user and return their token"""
        try:
            response = self.session.post(f"{self.base_url}/auth/register", json={
                "email": email,
                "password": password,
                "full_name": f"Test User {email.split('@')[0]}"
            })
            
            if response.status_code != 201:
                logger.warning(f"User registration failed for {email}: {response.status_code}")
            
            response = self.session.post(f"{self.base_url}/auth/login", data={
                "username": email,
                "password": password
            })
            
            if response.status_code == 200:
                token = response.json()["access_token"]
                self.user_tokens[email] = token
                logger.info(f"User {email} authenticated successfully")
                return token
            else:
                logger.error(f"User login failed for {email}: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"User creation error for {email}: {e}")
            return None
    
    def set_user_context(self, email: str):
        """Set session to use specific user's token"""
        if email in self.user_tokens:
            self.session.headers.update({"Authorization": f"Bearer {self.user_tokens[email]}"})
        else:
            logger.error(f"No token found for user {email}")
    
    def create_group(self, name: str, description: str) -> int:
        """Create a group and return its ID"""
        try:
            response = self.session.post(f"{self.base_url}/groups", json={
                "name": name,
                "description": description
            })
            if response.status_code == 201:
                group_id = response.json()["id"]
                logger.info(f"Created group '{name}' with ID {group_id}")
                return group_id
            else:
                logger.error(f"Group creation failed: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Group creation error: {e}")
            return None
    
    def create_prompt(self, name: str, content: str, category: str = "Analysis") -> int:
        """Create a prompt and return its ID"""
        try:
            response = self.session.post(f"{self.base_url}/prompts", json={
                "name": name,
                "content": content,
                "category": category
            })
            if response.status_code == 201:
                prompt_id = response.json()["id"]
                logger.info(f"Created prompt '{name}' with ID {prompt_id}")
                return prompt_id
            else:
                logger.error(f"Prompt creation failed: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Prompt creation error: {e}")
            return None
    
    def create_record(self, group_id: int, title: str, content: str) -> int:
        """Create a record and return its ID"""
        try:
            response = self.session.post(f"{self.base_url}/records", json={
                "group_id": group_id,
                "title": title,
                "content": content,
                "file_type": "text"
            })
            if response.status_code == 201:
                record_id = response.json()["id"]
                logger.info(f"Created record '{title}' with ID {record_id}")
                return record_id
            else:
                logger.error(f"Record creation failed: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Record creation error: {e}")
            return None
    
    def create_task(self, group_id: int, prompt_ids: List[int]) -> int:
        """Create a task and return its ID"""
        try:
            response = self.session.post(f"{self.base_url}/tasks", json={
                "group_id": group_id,
                "prompt_ids": prompt_ids
            })
            if response.status_code == 201:
                task_id = response.json()["id"]
                logger.info(f"Created task with ID {task_id}")
                return task_id
            else:
                logger.error(f"Task creation failed: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Task creation error: {e}")
            return None
    
    def wait_for_task_completion(self, max_wait: int = 300) -> bool:
        """Wait for all tasks to complete"""
        start_time = time.time()
        while time.time() - start_time < max_wait:
            try:
                response = self.session.get(f"{self.base_url}/tasks/status")
                if response.status_code == 200:
                    status = response.json()
                    if status["pending_tasks"] == 0:
                        logger.info("All tasks completed")
                        return True
                    else:
                        logger.info(f"Waiting for {status['pending_tasks']} tasks to complete...")
                        time.sleep(10)
                else:
                    logger.error(f"Task status check failed: {response.status_code}")
                    time.sleep(5)
            except Exception as e:
                logger.error(f"Task status check error: {e}")
                time.sleep(5)
        
        logger.error("Tasks did not complete within timeout")
        return False
    
    def get_knowledge_matrix(self, group_id: int = None) -> Dict:
        """Get knowledge matrix"""
        try:
            params = {"group_id": group_id} if group_id else {}
            response = self.session.get(f"{self.base_url}/matrix", params=params)
            if response.status_code == 200:
                matrix = response.json()
                logger.info(f"Retrieved knowledge matrix with {matrix['total_count']} items")
                return matrix
            else:
                logger.error(f"Matrix retrieval failed: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Matrix retrieval error: {e}")
            return None
    
    def export_knowledge_matrix(self, group_id: int = None) -> bool:
        """Export knowledge matrix to Excel"""
        try:
            params = {"group_id": group_id} if group_id else {}
            response = self.session.get(f"{self.base_url}/matrix/export", params=params)
            if response.status_code == 200:
                filename = f"test_matrix_{int(time.time())}.xlsx"
                with open(filename, 'wb') as f:
                    f.write(response.content)
                logger.info(f"Matrix exported to {filename}")
                return True
            else:
                logger.error(f"Matrix export failed: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Matrix export error: {e}")
            return False

    def scenario_1_research_papers(self) -> bool:
        """Scenario 1: Research Paper Analysis"""
        logger.info("=== SCENARIO 1: Research Paper Analysis ===")
        
        user_email = "researcher@example.com"
        self.create_test_user(user_email)
        self.set_user_context(user_email)
        
        group_id = self.create_group(
            "AI Research Papers 2024",
            "Collection of recent AI research papers for analysis"
        )
        if not group_id:
            return False
        
        prompts = [
            ("Paper Summary", "Provide a comprehensive summary of this research paper including main contributions, methodology, and key findings.", "Summary"),
            ("Key Innovations", "Identify and explain the key innovations and novel contributions presented in this paper.", "Analysis"),
            ("Methodology Analysis", "Analyze the research methodology used in this paper, including experimental design and evaluation metrics.", "Analysis"),
            ("Future Work", "Extract and summarize the future work and research directions mentioned in this paper.", "Extraction"),
            ("Technical Limitations", "Identify and discuss the technical limitations and potential weaknesses of the proposed approach.", "Evaluation")
        ]
        
        prompt_ids = []
        for name, content, category in prompts:
            prompt_id = self.create_prompt(name, content, category)
            if prompt_id:
                prompt_ids.append(prompt_id)
        
        papers = [
            ("Attention Is All You Need", "This paper introduces the Transformer architecture, a novel neural network architecture based solely on attention mechanisms..."),
            ("BERT: Pre-training of Deep Bidirectional Transformers", "We introduce BERT, a new language representation model which stands for Bidirectional Encoder Representations from Transformers..."),
            ("GPT-3: Language Models are Few-Shot Learners", "We train GPT-3, an autoregressive language model with 175 billion parameters, and test its performance in the few-shot setting..."),
            ("ResNet: Deep Residual Learning for Image Recognition", "We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously..."),
            ("AlphaGo: Mastering the game of Go with deep neural networks", "We introduce AlphaGo, the first computer program to defeat a human professional player in the full-sized game of Go..."),
            ("Dropout: A Simple Way to Prevent Neural Networks from Overfitting", "We propose dropout, a technique for addressing overfitting in neural networks by randomly setting a fraction of input units to 0..."),
            ("Adam: A Method for Stochastic Optimization", "We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions..."),
            ("Generative Adversarial Networks", "We propose a new framework for estimating generative models via an adversarial process..."),
            ("Word2Vec: Efficient Estimation of Word Representations", "We propose two novel model architectures for computing continuous vector representations of words from very large data sets..."),
            ("U-Net: Convolutional Networks for Biomedical Image Segmentation", "We present a network and training strategy that relies on the strong use of data augmentation to use the available annotated samples more efficiently...")
        ]
        
        record_ids = []
        for title, content in papers:
            record_id = self.create_record(group_id, title, content)
            if record_id:
                record_ids.append(record_id)
        
        task_id = self.create_task(group_id, prompt_ids)
        if not task_id:
            return False
        
        if self.wait_for_task_completion():
            matrix = self.get_knowledge_matrix(group_id)
            if matrix and matrix['total_count'] > 0:
                self.export_knowledge_matrix(group_id)
                logger.info(f"Scenario 1 completed successfully with {matrix['total_count']} knowledge items")
                return True
        
        return False

    def scenario_2_project_evaluation(self) -> bool:
        """Scenario 2: Project Evaluation"""
        logger.info("=== SCENARIO 2: Project Evaluation ===")
        
        user_email = "manager@example.com"
        self.create_test_user(user_email)
        self.set_user_context(user_email)
        
        group_id = self.create_group(
            "Project Proposals Q1 2024",
            "Collection of project proposals for evaluation and ranking"
        )
        if not group_id:
            return False
        
        prompts = [
            ("Technical Feasibility", "Rate the technical feasibility of this project on a scale of 1-5 (1=Very Difficult, 5=Very Feasible). Provide reasoning.", "Evaluation"),
            ("Business Impact", "Rate the potential business impact of this project on a scale of 1-5 (1=Low Impact, 5=High Impact). Explain your assessment.", "Evaluation"),
            ("Resource Requirements", "Rate the resource requirements for this project on a scale of 1-5 (1=Very High, 5=Very Low). Consider time, budget, and personnel.", "Evaluation"),
            ("Innovation Level", "Rate the innovation level of this project on a scale of 1-5 (1=Not Innovative, 5=Highly Innovative). Justify your rating.", "Evaluation"),
            ("Risk Assessment", "Rate the overall risk of this project on a scale of 1-5 (1=Very High Risk, 5=Very Low Risk). Identify key risk factors.", "Evaluation")
        ]
        
        prompt_ids = []
        for name, content, category in prompts:
            prompt_id = self.create_prompt(name, content, category)
            if prompt_id:
                prompt_ids.append(prompt_id)
        
        projects = [
            ("AI-Powered Customer Service Bot", "Develop an intelligent chatbot using large language models to handle customer inquiries automatically..."),
            ("Blockchain Supply Chain Tracking", "Implement a blockchain-based system to track products throughout the supply chain for transparency..."),
            ("IoT Smart Office Management", "Create an IoT ecosystem to manage office resources including lighting, temperature, and space utilization..."),
            ("Machine Learning Fraud Detection", "Build a real-time fraud detection system using machine learning algorithms to identify suspicious transactions..."),
            ("Augmented Reality Training Platform", "Develop an AR-based training platform for employee onboarding and skill development..."),
            ("Predictive Maintenance System", "Implement predictive analytics to forecast equipment failures and optimize maintenance schedules..."),
            ("Voice-Activated Inventory Management", "Create a voice-controlled system for warehouse inventory management and tracking..."),
            ("Automated Code Review Tool", "Build an AI-powered tool to automatically review code for bugs, security issues, and best practices..."),
            ("Smart Energy Management System", "Develop a system to optimize energy consumption across multiple facilities using AI..."),
            ("Personalized Learning Platform", "Create an adaptive learning platform that personalizes content based on individual learning patterns...")
        ]
        
        record_ids = []
        for title, content in projects:
            record_id = self.create_record(group_id, title, content)
            if record_id:
                record_ids.append(record_id)
        
        task_id = self.create_task(group_id, prompt_ids)
        if not task_id:
            return False
        
        if self.wait_for_task_completion():
            matrix = self.get_knowledge_matrix(group_id)
            if matrix and matrix['total_count'] > 0:
                self.export_knowledge_matrix(group_id)
                logger.info(f"Scenario 2 completed successfully with {matrix['total_count']} knowledge items")
                return True
        
        return False

    def scenario_3_news_articles(self) -> bool:
        """Scenario 3: News Article Processing for SEO"""
        logger.info("=== SCENARIO 3: News Article Processing for SEO ===")
        
        user_email = "content@example.com"
        self.create_test_user(user_email)
        self.set_user_context(user_email)
        
        group_id = self.create_group(
            "Tech News Articles",
            "Latest technology news articles for SEO-optimized content creation"
        )
        if not group_id:
            return False
        
        prompts = [
            ("SEO Title Generation", "Create an SEO-optimized title for this article that includes relevant keywords and is under 60 characters.", "Transformation"),
            ("Meta Description", "Write a compelling meta description for this article that is 150-160 characters and includes target keywords.", "Transformation"),
            ("Keyword Extraction", "Extract the top 10 most relevant keywords and phrases from this article for SEO purposes.", "Extraction"),
            ("Markdown Conversion", "Convert this article into well-structured Markdown format with proper headings, lists, and formatting.", "Transformation"),
            ("Content Summary", "Create a brief, engaging summary of this article that could be used as an introduction or social media post.", "Summary")
        ]
        
        prompt_ids = []
        for name, content, category in prompts:
            prompt_id = self.create_prompt(name, content, category)
            if prompt_id:
                prompt_ids.append(prompt_id)
        
        articles = [
            ("OpenAI Releases GPT-4 Turbo", "OpenAI has announced the release of GPT-4 Turbo, a more efficient and cost-effective version of their flagship language model..."),
            ("Google Unveils Quantum Computing Breakthrough", "Google researchers have achieved a significant milestone in quantum computing with their new quantum processor..."),
            ("Tesla's Full Self-Driving Beta Expands", "Tesla has expanded its Full Self-Driving beta program to more users, bringing autonomous driving capabilities to thousands of vehicles..."),
            ("Microsoft Integrates AI into Office Suite", "Microsoft has announced deep AI integration across its Office suite, bringing intelligent features to Word, Excel, and PowerPoint..."),
            ("Apple's Vision Pro Enters Mass Production", "Apple's highly anticipated Vision Pro mixed reality headset has entered mass production ahead of its consumer launch..."),
            ("Meta's Metaverse Investment Reaches $15B", "Meta has invested over $15 billion in metaverse technologies, despite facing criticism from investors about the strategy..."),
            ("Amazon's Drone Delivery Service Expands", "Amazon Prime Air drone delivery service is expanding to new cities, promising 30-minute delivery for eligible packages..."),
            ("NVIDIA's AI Chip Demand Surges", "NVIDIA reports unprecedented demand for its AI chips as companies rush to build artificial intelligence capabilities..."),
            ("SpaceX Achieves Record Rocket Reuse", "SpaceX has set a new record for rocket reusability, successfully launching and landing the same Falcon 9 booster for the 20th time..."),
            ("Cybersecurity Threats Rise with AI", "Security experts warn that AI-powered cyberattacks are becoming more sophisticated and harder to detect...")
        ]
        
        record_ids = []
        for title, content in articles:
            record_id = self.create_record(group_id, title, content)
            if record_id:
                record_ids.append(record_id)
        
        task_id = self.create_task(group_id, prompt_ids)
        if not task_id:
            return False
        
        if self.wait_for_task_completion():
            matrix = self.get_knowledge_matrix(group_id)
            if matrix and matrix['total_count'] > 0:
                self.export_knowledge_matrix(group_id)
                logger.info(f"Scenario 3 completed successfully with {matrix['total_count']} knowledge items")
                return True
        
        return False

    def scenario_4_security_assessment(self) -> bool:
        """Scenario 4: Security Assessment"""
        logger.info("=== SCENARIO 4: Security Assessment ===")
        
        user_email = "security@example.com"
        self.create_test_user(user_email)
        self.set_user_context(user_email)
        
        group_id = self.create_group(
            "Document Security Review",
            "Security assessment of various documents for compliance and risk evaluation"
        )
        if not group_id:
            return False
        
        prompts = [
            ("Personal Information Detection", "Analyze this document and identify any personal information (PII) such as names, addresses, phone numbers, or email addresses. Rate risk as HIGH/MEDIUM/LOW.", "Classification"),
            ("Confidential Content Assessment", "Determine if this document contains confidential or sensitive business information that should be protected. Provide a security classification.", "Classification"),
            ("Public Disclosure Readiness", "Assess whether this document is suitable for public disclosure. Identify any content that should be redacted or removed before publication.", "Evaluation"),
            ("Compliance Risk Analysis", "Evaluate this document for potential compliance risks related to data protection regulations (GDPR, CCPA, etc.).", "Analysis"),
            ("Security Recommendations", "Provide specific security recommendations for handling, storing, and sharing this document based on its content.", "Analysis")
        ]
        
        prompt_ids = []
        for name, content, category in prompts:
            prompt_id = self.create_prompt(name, content, category)
            if prompt_id:
                prompt_ids.append(prompt_id)
        
        documents = [
            ("Employee Handbook", "This handbook contains company policies, procedures, and general information for all employees. No personal data included."),
            ("Customer Database Export", "Customer records including names: John Smith, Jane Doe, email addresses: john@email.com, jane@email.com, and phone numbers."),
            ("Financial Report Q3", "Quarterly financial report containing revenue figures, profit margins, and strategic business information marked as confidential."),
            ("Marketing Campaign Plan", "Public marketing campaign strategy for product launch, including target demographics and advertising channels."),
            ("HR Interview Notes", "Interview notes containing candidate personal information, salary expectations, and assessment scores for hiring decisions."),
            ("Technical Documentation", "Public API documentation and user guides that can be shared with external developers and partners."),
            ("Legal Contract Template", "Standard contract template with placeholder fields for client information and project details."),
            ("Security Incident Report", "Detailed report of recent security breach including affected systems, user data compromised, and remediation steps."),
            ("Product Specifications", "Technical specifications for new product features, including proprietary algorithms and competitive advantages."),
            ("Training Materials", "General training materials for software usage that contain no sensitive or personal information.")
        ]
        
        record_ids = []
        for title, content in documents:
            record_id = self.create_record(group_id, title, content)
            if record_id:
                record_ids.append(record_id)
        
        task_id = self.create_task(group_id, prompt_ids)
        if not task_id:
            return False
        
        if self.wait_for_task_completion():
            matrix = self.get_knowledge_matrix(group_id)
            if matrix and matrix['total_count'] > 0:
                self.export_knowledge_matrix(group_id)
                logger.info(f"Scenario 4 completed successfully with {matrix['total_count']} knowledge items")
                return True
        
        return False

    def scenario_5_student_evaluation(self) -> bool:
        """Scenario 5: Student Report Evaluation"""
        logger.info("=== SCENARIO 5: Student Report Evaluation ===")
        
        user_email = "professor@example.com"
        self.create_test_user(user_email)
        self.set_user_context(user_email)
        
        group_id = self.create_group(
            "Computer Science Essays",
            "Student essay submissions for CS101 course evaluation"
        )
        if not group_id:
            return False
        
        prompts = [
            ("Content Quality", "Evaluate the content quality of this essay on a scale of 1-5. Consider accuracy, depth of understanding, and relevance to the topic.", "Evaluation"),
            ("Writing Clarity", "Rate the writing clarity and organization on a scale of 1-5. Assess structure, flow, grammar, and readability.", "Evaluation"),
            ("Critical Thinking", "Assess the level of critical thinking demonstrated on a scale of 1-5. Look for analysis, synthesis, and original insights.", "Evaluation"),
            ("Use of Sources", "Evaluate the use of sources and citations on a scale of 1-5. Consider relevance, credibility, and proper attribution.", "Evaluation"),
            ("Overall Grade", "Provide an overall grade (A-F) and detailed feedback explaining the strengths and areas for improvement.", "Evaluation")
        ]
        
        prompt_ids = []
        for name, content, category in prompts:
            prompt_id = self.create_prompt(name, content, category)
            if prompt_id:
                prompt_ids.append(prompt_id)
        
        essays = [
            ("The Impact of AI on Society - Student A", "Artificial Intelligence has revolutionized many aspects of modern society. This essay explores both positive and negative impacts, including job automation, healthcare improvements, and ethical considerations. The analysis includes multiple perspectives and current research findings."),
            ("Machine Learning Algorithms - Student B", "This report examines various machine learning algorithms including supervised, unsupervised, and reinforcement learning. The discussion covers practical applications, advantages, and limitations of each approach with relevant examples."),
            ("Cybersecurity Challenges - Student C", "Modern cybersecurity faces numerous challenges including advanced persistent threats, social engineering, and IoT vulnerabilities. This essay analyzes current defense strategies and emerging security technologies."),
            ("Cloud Computing Benefits - Student D", "Cloud computing offers scalability, cost-effectiveness, and accessibility. This paper discusses various cloud service models, deployment strategies, and considerations for businesses adopting cloud technologies."),
            ("Data Privacy Concerns - Student E", "With increasing digitization, data privacy has become a critical concern. This essay examines privacy regulations, data collection practices, and individual rights in the digital age."),
            ("Blockchain Technology - Student F", "Blockchain technology extends beyond cryptocurrency to various applications including supply chain management, voting systems, and smart contracts. This analysis explores potential benefits and current limitations."),
            ("Internet of Things - Student G", "The Internet of Things connects everyday devices to create smart environments. This essay discusses IoT applications in smart homes, cities, and industries while addressing security and privacy challenges."),
            ("Quantum Computing - Student H", "Quantum computing represents a paradigm shift in computational capabilities. This paper explores quantum principles, current developments, and potential applications in cryptography and optimization."),
            ("Software Engineering Practices - Student I", "Effective software engineering requires proper methodologies, testing practices, and project management. This essay examines agile development, DevOps practices, and quality assurance techniques."),
            ("Human-Computer Interaction - Student J", "Human-Computer Interaction focuses on designing intuitive and accessible interfaces. This analysis covers usability principles, user experience design, and emerging interaction paradigms.")
        ]
        
        record_ids = []
        for title, content in essays:
            record_id = self.create_record(group_id, title, content)
            if record_id:
                record_ids.append(record_id)
        
        task_id = self.create_task(group_id, prompt_ids)
        if not task_id:
            return False
        
        if self.wait_for_task_completion():
            matrix = self.get_knowledge_matrix(group_id)
            if matrix and matrix['total_count'] > 0:
                self.export_knowledge_matrix(group_id)
                logger.info(f"Scenario 5 completed successfully with {matrix['total_count']} knowledge items")
                return True
        
        return False

    def run_all_scenarios(self) -> bool:
        """Run all 5 test scenarios"""
        logger.info("Starting comprehensive test of all 5 scenarios")
        
        if not self.authenticate_admin():
            logger.error("Failed to authenticate as admin")
            return False
        
        scenarios = [
            ("Research Paper Analysis", self.scenario_1_research_papers),
            ("Project Evaluation", self.scenario_2_project_evaluation),
            ("News Article Processing", self.scenario_3_news_articles),
            ("Security Assessment", self.scenario_4_security_assessment),
            ("Student Report Evaluation", self.scenario_5_student_evaluation)
        ]
        
        results = {}
        for name, scenario_func in scenarios:
            logger.info(f"\n{'='*50}")
            logger.info(f"Running: {name}")
            logger.info(f"{'='*50}")
            
            try:
                result = scenario_func()
                results[name] = result
                if result:
                    logger.info(f"✅ {name} completed successfully")
                else:
                    logger.error(f"❌ {name} failed")
            except Exception as e:
                logger.error(f"❌ {name} failed with exception: {e}")
                results[name] = False
        
        logger.info(f"\n{'='*50}")
        logger.info("TEST SUMMARY")
        logger.info(f"{'='*50}")
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            logger.info(f"{name}: {status}")
        
        logger.info(f"\nOverall: {passed}/{total} scenarios passed")
        
        if passed == total:
            logger.info("🎉 All scenarios completed successfully!")
            return True
        else:
            logger.error(f"⚠️  {total - passed} scenarios failed")
            return False

def main():
    """Main test execution"""
    print("LLMKnowledge3 Comprehensive Test Suite")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:8000/healthz")
        if response.status_code != 200:
            print("❌ Backend is not running or not healthy")
            print("Please start the backend server first:")
            print("cd backend && poetry run uvicorn app.main:app --reload --port 8000")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at http://localhost:8000")
        print("Please start the backend server first:")
        print("cd backend && poetry run uvicorn app.main:app --reload --port 8000")
        return False
    
    print("✅ Backend is running and healthy")
    
    tester = LLMKnowledge3Tester()
    success = tester.run_all_scenarios()
    
    if success:
        print("\n🎉 All tests passed! LLMKnowledge3 is working correctly.")
        return True
    else:
        print("\n❌ Some tests failed. Please check the logs above.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
