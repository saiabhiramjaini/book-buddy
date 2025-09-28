# Book Buddy Backend API

A Node.js backend API for a kids' book sharing platform where children can share, discover, and request books from other young readers in their community.

## Overview

Book Buddy enables kids to:
- Add books they want to share with others
- Browse and discover books from the community
- Request books either for free or through exchange
- Manage their book collections and transaction requests

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with HTTP-only cookies
- **Validation**: Zod schemas
- **Database Provider**: Neon (PostgreSQL)

## Live Demo & Documentation

- **Deployed API**: https://book-buddy-server.abhiramtech.in/
- **GitHub Repository**: https://github.com/saiabhiramjaini/book-buddy
- **Postman Collection**: [Complete API Documentation](https://documenter.getpostman.com/view/24467789/2sB3QDwYN8)
- **Docker Hub**: [saiabhiramjaini/book-buddy-server](https://hub.docker.com/repository/docker/saiabhiramjaini/book-buddy-server)

## API Endpoints Summary

For complete API documentation with request/response examples, please visit the [Postman Collection](https://documenter.getpostman.com/view/24467789/2sB3QDwYN8).

### Authentication Routes (`/api/v1/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/signup` | Register a new user |
| POST   | `/signin` | User login |
| POST   | `/signout` | User logout |

### User Routes (`/api/v1/user`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/profile` | Get user profile | ✓ |
| GET    | `/books` | Get user's books | ✓ |
| GET    | `/transactions` | Get user's transactions | ✓ |

### Book Routes (`/api/v1/books`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/` | Get all books with filters/pagination | ✓ |
| GET    | `/:id` | Get specific book details | ✓ |
| POST   | `/` | Create a new book | ✓ |
| PATCH  | `/:id` | Update book (owner only) | ✓ |
| DELETE | `/:id` | Delete book (owner only) | ✓ |

### Transaction Routes (`/api/v1/transaction`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST   | `/` | Create book request | ✓ |
| PATCH  | `/:id` | Update transaction status (owner only) | ✓ |

## Database Schema

### Users Table
```sql
- id (Primary Key, Auto-increment)
- name (VARCHAR, NOT NULL)
- email (VARCHAR, UNIQUE, NOT NULL)
- avatar (VARCHAR, DEFAULT '')
- password (VARCHAR, NOT NULL, Hashed)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Books Table
```sql
- id (Primary Key, Auto-increment)
- title (VARCHAR, NOT NULL)
- author (VARCHAR, NOT NULL)
- genre (VARCHAR, NOT NULL)
- ageGroup (VARCHAR, NOT NULL)
- coverImage (VARCHAR, NOT NULL)
- availabilityType (ENUM: 'Free', 'Exchange')
- status (VARCHAR, DEFAULT 'available')
- ownerId (Foreign Key -> users.id)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Transactions Table
```sql
- id (Primary Key, Auto-increment)
- requesterId (Foreign Key -> users.id)
- requestedBookId (Foreign Key -> books.id)
- ownerId (Foreign Key -> users.id)
- type (ENUM: 'Free', 'Exchange')
- offeredBookId (Foreign Key -> books.id, NULLABLE)
- status (ENUM: 'available', 'pending', 'approved', 'rejected', 'shared')
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

## Business Logic

### Book Request Flow

1. **Free Request**: User requests a book marked as "Free"
2. **Exchange Request**: User offers one of their books in exchange
3. **Owner Approval**: Book owner can approve/reject requests
4. **Status Updates**: Book status changes based on transaction state

### Transaction States

- **pending**: Initial state when request is submitted
- **approved**: Owner accepted the request
- **rejected**: Owner declined the request
- **shared**: Book has been successfully shared (future implementation)

## API Features

### Books API
- **Pagination**: Page-based pagination with configurable limits
- **Search**: Search by title and author
- **Filtering**: Filter by genre, age group, availability type
- **Sorting**: Sort by various fields (title, author, date, etc.)

### Authentication
- **JWT Tokens**: Secure authentication with 7-day expiry
- **HTTP-only Cookies**: Tokens stored securely in cookies
- **Password Hashing**: bcryptjs with 12 salt rounds

### Validation
- **Input Validation**: Zod schemas for all endpoints
- **Error Handling**: Comprehensive error responses
- **Type Safety**: Full TypeScript implementation

## Environment Variables

```env
# Server Configuration
PORT=3000

# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# CORS (Optional)
CLIENT_URL="http://localhost:5173"
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/saiabhiramjaini/book-buddy.git
cd book-buddy/server
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database Setup**
```bash
# Generate database migrations
npx drizzle-kit generate

# Run migrations (if using drizzle-kit push)
npx drizzle-kit push
```

5. **Development Server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Docker Deployment

### Using Pre-built Image

```bash
# Pull the latest image
docker pull saiabhiramjaini/book-buddy-server:latest

# Run container
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-jwt-secret" \
  --name book-buddy-server \
  saiabhiramjaini/book-buddy-server:latest
```

### Building from Source

```bash
# Build image
docker build -t book-buddy-backend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-db-url" \
  -e JWT_SECRET="your-jwt-secret" \
  book-buddy-backend
```

## AWS EC2 Deployment

The application is currently deployed on AWS EC2 with the following configuration:

### Nginx Reverse Proxy Configuration

```nginx
events {
    # Event directives...
}
http {
    server {
        listen 80;
        server_name book-buddy-server.abhiramtech.in;
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### SSL Certificate Setup

```bash
# Install Certbot and obtain SSL certificate
sudo certbot --nginx -d book-buddy-server.abhiramtech.in
```

## CI/CD Pipeline

### GitHub Actions Workflows

The project includes two main workflows:

1. **Build Verification** (`.github/workflows/build.yml`)
   - Triggers on PRs and pushes to main
   - Installs dependencies and builds the project
   - Generates Drizzle schemas

2. **Docker Deployment** (`.github/workflows/deploy.yml`)
   - Builds and pushes Docker image to Docker Hub
   - Automatically deploys to EC2 instance
   - Updates running containers with zero downtime

### Required GitHub Secrets

```bash
# Docker Hub
DOCKER_USERNAME
DOCKER_PASSWORD

# EC2 Deployment
SSH_HOST
SSH_USERNAME
SSH_KEY

# Environment Variables
ENV_PORT
ENV_DATABASE_URL
ENV_CLIENT_URL
ENV_JWT_SECRET
```

## Testing the API

### Health Check
```bash
curl https://book-buddy-server.abhiramtech.in/api/v1/health
```

### Using Postman
Import the complete collection from: https://documenter.getpostman.com/view/24467789/2sB3QDwYN8

The collection includes:
- All API endpoints with examples
- Environment variables setup
- Authentication flow examples
- Request/response samples

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific field error"
    }
  ]
}
```

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Security**: Secure token generation with expiration
- **Input Validation**: Comprehensive validation with Zod
- **HTTP-only Cookies**: Secure token storage
- **CORS Configuration**: Controlled cross-origin requests
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **SSL/TLS**: HTTPS encryption with Let's Encrypt certificates

## Monitoring & Maintenance

- **Docker Health Checks**: Container health monitoring
- **Automated Deployments**: CI/CD pipeline with GitHub Actions
- **SSL Auto-renewal**: Certbot automatic certificate renewal
- **Database Backups**: Regular PostgreSQL backups (Neon managed)

## Contributing

1. Fork the repository: https://github.com/saiabhiramjaini/book-buddy
2. Create a feature branch
3. Make your changes
4. Test using the Postman collection
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues:
- Create an issue in the [GitHub repository](https://github.com/saiabhiramjaini/book-buddy)
- Test API endpoints using the [Postman collection](https://documenter.getpostman.com/view/24467789/2sB3QDwYN8)
- Check the live API at https://book-buddy-server.abhiramtech.in/