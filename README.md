## Quick Start

### With Docker (recommended)

```bash
cp .env.example .env  
docker compose up --build -d
```

Service available at `http://localhost:3000`.

### Without Docker

```bash
cp .env.example .env
npm install
npm start
```

## API Reference

### Auth

#### Generate Token

```
POST /api/auth/token
Content-Type: application/json

{ "userName": "john_doe" }
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "expiresIn": "1h",
    "tokenType": "Bearer"
  }
}
```

#### Verify Token

```
GET /api/auth/verify
Authorization: Bearer <token>
```

---

### Users _(all require `Authorization: Bearer <token>`)_

#### Create User

```
POST /api/users
{
  "userName": "John Doe",
  "accountNumber": "1234567890",
  "emailAddress": "john@example.com",
  "identityNumber": "1234567890123456"
}
```

#### List Users

```
GET /api/users?page=1&limit=10
```

#### Get User by ID

```
GET /api/users/:id
```

#### Get User by Account Number

```
GET /api/users/account/:accountNumber
```

#### Get User by Identity Number

```
GET /api/users/identity/:identityNumber
```

#### Update User

```
PUT /api/users/:id
{ "userName": "Jane Doe" }
```

#### Delete User

```
DELETE /api/users/:id
```

---

## Running Tests

```bash
npm test              
npm run test:watch    
```

Tests use `mongodb-memory-server`

---

## Health Check

```
GET /health
```

```json
{ "status": "healthy", "service": "ms-ali-akbar-betest", "timestamp": "..." }
```
