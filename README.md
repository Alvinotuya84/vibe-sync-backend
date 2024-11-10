# VibeSync Backend API

A robust NestJS backend service powering the VibeSync social media platform.

## 🌟 Features

### API Features

- RESTful API endpoints
- Real-time WebSocket connections
- File upload handling
- Authentication & Authorization
- User management
- Content management
- Interaction handling
- Chat system
- Notification system

### Technical Features

- PostgreSQL database integration
- TypeORM for database management
- JWT authentication
- File storage system
- Real-time notifications
- WebSocket support
- Rate limiting
- Request validation

## 🛠 Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT, Passport
- **Real-time**: Socket.IO
- **File Upload**: Multer
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI

## 🏗 Project Structure

```

src/
├── config/ # Configuration files
├── modules/ # Feature modules
│ ├── auth/ # Authentication
│ ├── users/ # User management
│ ├── content/ # Content management
│ ├── chat/ # Chat functionality
│ └── notifications/ # Notification system
├── shared/ # Shared resources
├── database/ # Database configurations
└── utils/ # Utility functions

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18+
- PostgreSQL 12+
- npm or yarn
- Redis (optional, for caching)

### Installation

```bash
# Install dependencies
npm install

# Setup database
npm run typeorm:migration:run

# Start development server
npm run start:dev

# Build for production
npm run build
```

### Environment Setup

Create a `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=vibesync

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development
```

## 📝 API Documentation

### API Endpoints

#### Authentication

- POST /auth/register
- POST /auth/login
- POST /auth/refresh-token

#### Users

- GET /users/me
- PATCH /users/profile
- POST /users/verify

#### Content

- POST /content
- GET /content/feed
- POST /content/:id/like
- POST /content/:id/comment

#### Chat

- GET /chat/conversations
- POST /chat/messages
- GET /chat/:id/messages

### WebSocket Events

- `connection`: Client connection
- `disconnect`: Client disconnection
- `message`: New chat message
- `notification`: Real-time notification

## 🔒 Security Implementations

- JWT Authentication
- Request validation
- Rate limiting
- CORS configuration
- File upload validation
- SQL injection prevention
- XSS protection

## 💾 Database Schema

### Core Tables

- users
- content
- likes
- comments
- conversations
- messages
- notifications

### Relations

- One-to-Many: User -> Content
- Many-to-Many: Users -> Conversations
- One-to-Many: Content -> Comments

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Monitoring & Logging

- Winston logger implementation
- Request logging
- Error tracking
- Performance monitoring
- Database query logging

## 🚀 Deployment

### Production Setup

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Support

```bash
# Build Docker image
docker build -t vibesync-api .

# Run container
docker run -p 3000:3000 vibesync-api
```

## 🔄 CI/CD

- GitHub Actions workflows
- Automated testing
- Code quality checks
- Automated deployment

## 📈 Performance Optimization

- Database indexing
- Query optimization
- Caching strategies
- Rate limiting
- File compression

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch
3. Commit your Changes
4. Push to the Branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License

## 📞 Support

For support, email otuyaalvin@gmail.com or join our Discord channel.

## 🔄 Version History

- v1.0.0: Initial Release
  - Basic authentication
  - Content management
  - Chat system
- v1.1.0: Real-time Features
  - WebSocket implementation
  - Notification system
