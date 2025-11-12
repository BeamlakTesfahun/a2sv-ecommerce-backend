# E-Commerce Platform Backend

A RESTful API built with **Node.js**, **TypeScript**, **Express**, and **Prisma (PostgreSQL)** for managing users, products, and orders.

---

## Features

- **Authentication**
  - Secure JWT-based login and registration
  - Password hashing via bcrypt
  - Role-based access control (User / Admin)

- **Product Management**
  - Full CRUD for products (Admin only)
  - Optional image upload via **Cloudinary**
  - Public product listing with pagination and search

- **Order Management**
  - Authenticated users can place orders
  - Transactional order creation with stock validation
  - View personal order history

- **Validation & Error Handling**
  - Strong input validation with **Zod**
  - Centralized error handler for consistent responses

---

## Tech Stack

| Layer          | Technology           |
| -------------- | -------------------- |
| Language       | TypeScript (Node.js) |
| Framework      | Express              |
| ORM            | Prisma               |
| Database       | PostgreSQL           |
| Authentication | JWT + bcrypt         |
| Validation     | Zod                  |
| File Upload    | Multer + Cloudinary  |
| Dev Tools      | tsx, nodemon, dotenv |

---

## Setup Instructions

### Clone the repository

git clone https://github.com/BeamlakTesfahun/a2sv-ecommerce-backend.git
cd <2sv-ecommerce-backend

### Install dependencies

npm install

### Set up environment variables

Create a `.env` file in the project root and define the following variables:

# Database Configuration

DATABASE_URL=

# Server Settings

PORT=  
NODE_ENV=

# JWT Authentication

JWT_SECRET=

# PostgreSQL (for Docker)

POSTGRES_USER=  
POSTGRES_DB=  
POSTGRES_PASSWORD=  
POSTGRES_PORT=

# Cloudinary Configuration

CLOUDINARY_CLOUD_NAME=  
CLOUDINARY_API_KEY=  
CLOUDINARY_API_SECRET=

---

### Run the Database (via Docker)

docker compose up -d

### Apply Prisma Migrations

npx prisma migrate dev --name init

### Generate Prisma Client

npx prisma generate

### Start the Server

Development mode:  
npm run dev

Build & run production:  
npm run build && npm start

---

## API Endpoints

### Auth

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| POST   | /api/v1/auth/register | Register new user     |
| POST   | /api/v1/auth/login    | Login and receive JWT |

### Products

| Method | Endpoint             | Auth   | Description                            |
| ------ | -------------------- | ------ | -------------------------------------- |
| GET    | /api/v1/products     | Public | List products (pagination + search)    |
| GET    | /api/v1/products/:id | Public | Get product by ID                      |
| POST   | /api/v1/products     | Admin  | Create product (optional image upload) |
| PUT    | /api/v1/products/:id | Admin  | Update product                         |
| DELETE | /api/v1/products/:id | Admin  | Delete product                         |

### Orders

| Method | Endpoint       | Auth | Description                 |
| ------ | -------------- | ---- | --------------------------- |
| POST   | /api/v1/orders | User | Place new order             |
| GET    | /api/v1/orders | User | View personal order history |

---

## API Documentation

Full endpoint details, request/response schemas, and examples are available in the API Documentation:  
[**View API Documentation**](https://www.postman.com/universal-crescent-257007/workspace/a2sv-ecommerce-backend/collection/31313072-1ff94afd-c49e-4176-871b-3e30032b485a?action=share&creator=31313072&active-environment=31313072-1475ecee-b586-41dd-82a5-277ffae1f6f1)

---

## Design Choices

- **TypeScript** provides static typing for safer, maintainable code.
- **Prisma ORM** simplifies database interactions with a type-safe API.
- **Zod** handles runtime input validation gracefully.
- **Cloudinary** for secure and reliable image uploads.
- **PostgreSQL** chosen for ACID compliance and relational integrity.
- **Layered architecture**:
  - Controllers handle HTTP requests/responses.
  - Services encapsulate core business logic.

---

## Scripts

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| npm run dev            | Start development server (tsx watch mode) |
| npm run build          | Compile TypeScript to JavaScript          |
| npm start              | Run compiled production build             |
| npx prisma studio      | Open Prisma DB UI                         |
| npx prisma migrate dev | Apply database migrations                 |

---
