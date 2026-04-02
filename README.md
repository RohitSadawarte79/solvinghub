# SolvingHub

A platform for discovering and solving real-world problems through collaborative problem-solving and solution sharing.

## 🚀 Features

- **Problem Discovery**: Browse and discover problems across various categories
- **Solution Submission**: Submit and vote on solutions to problems
- **User Rankings**: Gamified ranking system (F → S) based on contributions
- **Discussion System**: Comment and reply functionality for collaborative problem-solving
- **OAuth Authentication**: Secure Google OAuth integration with JWT tokens
- **Real-time Updates**: Live voting and discussion updates
- **Responsive Design**: Mobile-first design with dark mode support

## 🏗️ Architecture

### Backend (Go)
- **Framework**: Standard library with custom routing
- **Database**: PostgreSQL 16 with migrations
- **Authentication**: Google OAuth + JWT
- **Architecture**: Clean Architecture with Domain-Driven Design
- **Testing**: Unit tests with mocks
- **Documentation**: OpenAPI 3.0 specification

### Frontend (Next.js 15)
- **Framework**: Next.js 15 with App Router
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + localStorage
- **TypeScript**: Strict mode enabled
- **Testing**: Vitest + React Testing Library

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Go 1.25+ (for local development)
- PostgreSQL 16+ (if not using Docker)

## 🛠️ Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/RohitSadawarte79/solvinghub.git
   cd solvinghub
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - API Documentation: http://localhost:8080/docs
   - Health Check: http://localhost:8080/health

### Local Development

#### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   go mod download
   ```

2. **Set up database**
   ```bash
   # Start PostgreSQL (or use Docker)
   docker run --name solvinghub-db -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=solvinghub_db -p 5432:5432 -d postgres:16
   
   # Run migrations
   psql postgresql://solvinghub:secret@localhost:5432/solvinghub_db -f migrations/001_create_users.sql
   # ... run all migration files in order
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Google OAuth credentials
   ```

4. **Run the server**
   ```bash
   go run ./cmd/server
   ```

#### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local if needed
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `DB_DSN` | PostgreSQL connection string | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `GOOGLE_REDIRECT_URL` | OAuth callback URL | `http://localhost:8080/api/v1/auth/google/callback` |
| `JWT_SECRET` | JWT signing secret | - |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8080/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `SolvingHub` |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `0.1.0` |

## 🔧 Development

### Database Migrations

Migrations are automatically run when using Docker. For manual migration:

```bash
# Run all migrations
psql $DB_DSN -f migrations/001_create_users.sql
psql $DB_DSN -f migrations/002_create_problems.sql
# ... continue in order
```

### API Documentation

OpenAPI specification is available at:
- Development: http://localhost:8080/docs
- Production: https://api.solvinghub.com/docs

### Testing

#### Backend Tests
```bash
cd backend
go test ./...
```

#### Frontend Tests
```bash
cd frontend
npm test
npm run test:watch
```

### Code Quality

#### Backend
```bash
go fmt ./...
go vet ./...
go mod tidy
```

#### Frontend
```bash
npm run lint
npm run lint:fix
npm run format  # Using Prettier
```

## 🏛️ API Endpoints

### Authentication
- `GET /api/v1/auth/google` - Initiate OAuth flow
- `GET /api/v1/auth/google/callback` - OAuth callback
- `POST /api/v1/auth/logout` - Logout

### Problems
- `GET /api/v1/problems` - List problems
- `POST /api/v1/problems` - Create problem (auth required)
- `GET /api/v1/problems/{id}` - Get problem details
- `PUT /api/v1/problems/{id}` - Update problem (auth required)
- `DELETE /api/v1/problems/{id}` - Delete problem (auth required)

### Solutions
- `GET /api/v1/problems/{id}/solutions` - List solutions
- `POST /api/v1/problems/{id}/solutions` - Submit solution (auth required)
- `GET /api/v1/solutions/{id}` - Get solution details
- `PUT /api/v1/solutions/{id}` - Update solution (auth required)
- `DELETE /api/v1/solutions/{id}` - Delete solution (auth required)

### Comments & Votes
- `GET /api/v1/problems/{id}/comments` - List comments
- `POST /api/v1/problems/{id}/comments` - Add comment (auth required)
- `POST /api/v1/comments/{id}/replies` - Reply to comment (auth required)
- `POST /api/v1/problems/{id}/vote` - Vote on problem (auth required)

### Health & System
- `GET /health` - Health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe
- `GET /docs` - API documentation

## 🎯 User Ranking System

Users progress through ranks based on their contributions:

| Rank | Points Required | Title |
|------|-----------------|--------|
| F | 0 | Novice |
| E | 100 | Apprentice |
| D | 300 | Contributor |
| C | 600 | Specialist |
| B | 1000 | Expert |
| A | 2000 | Master |
| S | 5000 | Legend |

Points are earned through:
- Submitting solutions
- Having solutions accepted
- Receiving votes on solutions
- Community engagement

## 🚀 Deployment

### Production Docker Deployment

1. **Set production environment variables**
   ```bash
   export POSTGRES_PASSWORD=$(openssl rand -base64 32)
   export JWT_SECRET=$(openssl rand -base64 32)
   export GOOGLE_CLIENT_ID="your-client-id"
   export GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

2. **Deploy with production compose**
   ```bash
   docker-compose -f docker-compose.yml --env-file .env up -d
   ```

### Environment-Specific Configs

- **Development**: Debug logging, relaxed CORS
- **Production**: JSON logging, secure cookies, HTTPS-only

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` endpoint for API documentation
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

## 🙏 Acknowledgments

- Built with Go, Next.js, PostgreSQL, and Tailwind CSS
- Icons by [Lucide](https://lucide.dev/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Authentication with Google OAuth
