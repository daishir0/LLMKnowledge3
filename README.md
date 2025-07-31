# LLMKnowledge3

A modern knowledge management system that transforms documents into structured knowledge using AI. Built with React, FastAPI, and TypeScript.

## Features

- **Document Processing**: Upload and process PDF, PPT, Word, and text files
- **AI-Powered Analysis**: Generate knowledge using multiple AI providers (OpenAI, Anthropic, Gemini, LMStudio)
- **Knowledge Matrix**: 
  - Create matrix definitions to combine multiple groups
  - Real-time web interface display with interactive tables
  - Excel export with rows as records, columns as prompts, cells as knowledge
  - Support for plain knowledge text extraction
- **User Management**: Multi-user support with role-based access control
- **RESTful API**: Complete API access for all functionality
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Python 3.8+ with Poetry
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/daishir0/LLMKnowledge3.git
cd LLMKnowledge3
```

2. Install backend dependencies:
```bash
cd backend
poetry install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

Start both backend and frontend with a single command:

```bash
# From the root directory
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
cd backend
poetry run uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Default Admin Account

- Email: admin@example.com
- Password: admin123

## Architecture

### Backend (FastAPI)
- **Authentication**: JWT-based with role management
- **Database**: SQLite (default) or PostgreSQL
- **AI Integration**: Multiple provider support
- **File Processing**: MarkItDown integration
- **API**: RESTful endpoints with OpenAPI documentation

### Frontend (React + TypeScript)
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: React Context
- **Routing**: React Router
- **Build Tool**: Vite

## Usage Scenarios

LLMKnowledge3 supports five main usage patterns:

### 1. Research Paper Analysis
- Upload multiple PDF research papers
- Create analysis prompts (summary, key findings, methodology)
- Generate comparative knowledge matrix

### 2. Project Evaluation
- Upload project proposal documents
- Define evaluation criteria prompts (1-5 scale ratings)
- Generate evaluation matrix for decision making

### 3. News Article Processing
- Upload news text files
- Create SEO-optimized content prompts
- Generate markdown articles for publication

### 4. Security Assessment
- Process files from directories
- Create security evaluation prompts
- Assess personal information, security risks, and public disclosure readiness

### 5. Student Report Evaluation
- Upload student assignment files
- Create rubric-based evaluation prompts
- Generate scoring matrix for grading

## API Usage

All functionality is available via RESTful API:

```bash
# Authentication
POST /auth/login
POST /auth/register

# Groups
GET /groups
POST /groups
PUT /groups/{id}
DELETE /groups/{id}

# Records (Documents)
GET /records
POST /records
POST /records/upload
PUT /records/{id}
DELETE /records/{id}

# Prompts
GET /prompts
POST /prompts
PUT /prompts/{id}
DELETE /prompts/{id}

# Tasks
GET /tasks
POST /tasks
DELETE /tasks/{id}
GET /tasks/status

# Knowledge
GET /knowledge
DELETE /knowledge/{id}

# Matrix
GET /matrix/definitions        # List matrix definitions  
POST /matrix/definitions       # Create matrix definition
PUT /matrix/definitions/{id}   # Update matrix definition
DELETE /matrix/definitions/{id} # Delete matrix definition
GET /matrix/view/{id}          # View matrix data
GET /matrix/export/{id}/excel  # Export matrix to Excel
GET /matrix/legacy             # Legacy matrix endpoint

# Admin
GET /admin/users
PUT /admin/users/{id}
GET /admin/stats
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

Key configuration options:
- `DATABASE_URL`: SQLite (default) or PostgreSQL connection string
- `SECRET_KEY`: JWT signing key (change in production)
- `OPENAI_API_KEY`: For OpenAI integration (optional)
- `ADMIN_USERNAME/EMAIL/PASSWORD`: Default admin account credentials
- `ALLOWED_ORIGINS`: CORS allowed origins for frontend

See `.env.example` for all available configuration options.

### Database Setup

The application automatically creates the database and tables on first run. To use PostgreSQL instead of SQLite, update the `DATABASE_URL` in your `.env` file.

## Testing

Run the comprehensive test suite:

```bash
# Backend tests
cd backend
poetry run pytest

# Frontend tests
cd frontend
npm test

# Integration tests (requires running application)
python tests/test_scenarios.py
```

## Development

### Project Structure

```
LLMKnowledge3/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # Authentication
│   │   ├── services.py     # Business logic
│   │   └── main.py         # Application entry
│   ├── tests/              # Backend tests
│   └── pyproject.toml      # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── lib/            # Utilities
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json        # Node dependencies
├── tests/                  # Integration tests
└── docs/                   # Documentation
```

### Adding New Features

1. **Backend**: Add routes in `app/routers/`, update models/schemas as needed
2. **Frontend**: Create components in `src/components/` or pages in `src/pages/`
3. **API Integration**: Update `src/lib/api.ts` with new endpoints
4. **Types**: Add TypeScript interfaces in `src/types/index.ts`

## Security

- JWT-based authentication with secure token handling
- Role-based access control (admin/user)
- Input validation and sanitization
- CORS configuration
- Rate limiting on API endpoints
- Secure file upload handling

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions and support:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the test scenarios in `/tests`

## Changelog

### v3.0.0
- Complete rewrite in React + FastAPI
- **NEW: Matrix Definition System** - Create reusable matrix configurations
- **NEW: Interactive Matrix Display** - Real-time web interface with table view
- **Enhanced Excel Export** - Proper matrix format (rows=records, columns=prompts, cells=knowledge)
- **Plain Knowledge Support** - Extract and display original text alongside AI-generated knowledge
- Improved user management and authentication
- Enhanced AI provider support
- Mobile-responsive design
- Comprehensive test coverage
