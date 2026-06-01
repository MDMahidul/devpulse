# Dev Pulse

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Database Setup](#databas-setup)
  - [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
  - [Auth](#user)
  - [Issues](#issues)
- [Error Handling](#error-handling)
- [Live Link](#live-link)

## Introduction

A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions. Built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **Authentication & Authorization**

  - User registration with role-based access (contributor/maintainer)
  - Secure JWT-based authentication
  - Password hashing with bcrypt (10-12 salt rounds)

- **Issue Management**

  - Create bug reports and feature requests
  - View all issues with sorting and filtering
  - Update issue details (title, description, type)
  - Delete issues (maintainer only)
  - Issue status workflow (open → in_progress → resolved)

- **Role-Based Permissions**
  - **Contributors**: Create issues, view all issues, update their own open issues
  - **Maintainers**: Full CRUD access, update any issue, delete any issue, change status

## Technologies Used

- Node.js
- Express.js
- PostgreSQL
- pg
- dotenv
- TypeScript
- JWT (JSON Web Tokens) for authentication
- HTTP Status for status code
- bcrypt for password hashing

## Getting Started

### Prerequisites

- Node.js (v24 or higher)
- PostgreSQL database (local, NeonDB, Supabase, or ElephantSQL)
- npm package manager
- Git

### Installation

#### 1. Clone the repository:

```bash
git clone https://github.com/MDMahidul/devpulse
cd devpulse
```

#### 2. Install dependencies:

```bash
npm install
```

### Configuration

Create a .env file in the root directory and add the following environment variables:

```bash
PORT= 5000
CONNECTION_STRING= postgresql_url
BCRYPT_SALT_ROUNDS= 12
JWT_SECRET= jwt_secret

```

### Database Setup

Run the following SQL commands to create and configure the database:

```bash
// Create users table
  CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50),
      email VARCHAR(50) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(25) DEFAULT 'contributor',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
  )

// Create issues table
  CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    reporter_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
```

### Running the server

To start the server in development mode:

```bash
npm run start:dev
```

To start the server in production mode:

```bash
npm run start:prod
```

## API Endpoints

### User:

- **Sign Up**

  - **Route**: /api/auth/signup (POST)
  - **Request Body**:
    ```json
    {
      "name": "John Doe",
      "email": "john.doe@devpulse.com",
      "password": "securePassword123",
      "role": "contributor"
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@devpulse.com",
        "role": "contributor",
        "created_at": "2026-01-20T09:00:00Z",
        "updated_at": "2026-01-20T09:00:00Z"
      }
    }
    ```

- **User Login**
  - **Route**: /api/auth/login (POST)
  - **Request Body**:
    ```json
    {
      "email": "john.doe@devpulse.com",
      "password": "securePassword123"
    }
    ```
  - **Response**: jwt token will be generate after successfully login
    ```json
    {
      "success": true,
      "message": "Login successful",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
          "id": 1,
          "name": "John Doe",
          "email": "john.doe@devpulse.com",
          "role": "contributor",
          "created_at": "2026-01-20T09:00:00Z",
          "updated_at": "2026-01-20T09:00:00Z"
        }
      }
    }
    ```

### Issues:

- **Create issues (Authenticated users (contributor, maintainer))**
  - **Route**: /api/issues (POST)
  - **Request Headers**: Authorization: jwt_token
  - **Request Body**:
    ```json
    {
      "title": "Database connection timeout under load",
      "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
      "type": "bug"
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Issue created successfully",
      "data": {
        "id": 45,
        "title": "Database connection timeout under load",
        "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
        "type": "bug",
        "status": "open",
        "reporter_id": 1,
        "created_at": "2026-01-20T10:30:00Z",
        "updated_at": "2026-01-20T10:30:00Z"
      }
    }
    ```
- **Get All Issues(with filters)**

  - **Route**: /api/issues?sort=oldest&type=bug&status=open (GET)
  - **Response**:

    ```json
    {
      "success": true,
      "message": "Issues retrieved successfully",
      "data": [
        {
          "id": 45,
          "title": "Database connection timeout under load",
          "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
          "type": "bug",
          "status": "open",
          "reporter": {
            "id": 1,
            "name": "John Doe",
            "role": "contributor"
          },
          "created_at": "2026-01-20T10:30:00Z",
          "updated_at": "2026-01-20T14:45:00Z"
        }
      ]
    }
    ```

- **Get Single Issue**

  - **Route**: /api/issues/:id (GET)
  - **Response**:

    ```json
    {
      "success": true,
      "message": "Issue retrived successfully",
      "data": {
        "id": 45,
        "title": "Database connection timeout under load",
        "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
        "type": "bug",
        "status": "open",
        "reporter": {
          "id": 1,
          "name": "John Doe",
          "role": "contributor"
        },
        "created_at": "2026-01-20T10:30:00Z",
        "updated_at": "2026-01-20T14:45:00Z"
      }
    }
    ```

- **Update Issue (Maintainer (any issue) OR Contributor (own issue, only if status is open))**
  - **Route**: /api/issues/:id (PATCH)
  - **Request Headers**: Authorization: jwt_token
  - **Request Body**:
    ```json
    {
      "title": "Updated: Database pool exhaustion fix needed",
      "description": "Updated description with reproduction steps...",
      "type": "bug"
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Issue updated successfully",
      "data": {
        "id": 45,
        "title": "Updated: Database pool exhaustion fix needed",
        "description": "Updated description with reproduction steps...",
        "type": "bug",
        "status": "in_progress",
        "reporter_id": 1,
        "created_at": "2026-01-20T10:30:00Z",
        "updated_at": "2026-01-20T14:45:00Z"
      }
    }
    ```
- **Delete Issue (Maintainer Only)**
  - **Route**: /api/issues/:id (DELETE)
  - **Request Headers**: Authorization: jwt_token
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Issue deleted successfully"
    }
    ```

## Error Handling

Errors are handled using custom error classes and middleware. Common errors include:

- **Authentication Middleware:**

  - Implemented an Authentication Middleware to authenticate the application. Ensured that only Maintainer and Contributor can access their own accessible routes.
  - **Response**

    ```json
    {
      "success": false,
      "statusCode": 401,
      "message": "Unauthorized access!!!"
    }
    ```

- **Error Handling**:

  - Implemented error handling throughout the application. Used global error handling middleware to catch and handle errors, providing appropriate error responses error messages.
  - **Sample Error Response**:
    ```json
    {
      "success": false,
      "message": "invalid signature",
      "error": {
        "name": "JsonWebTokenError",
        "message": "invalid signature"
      }
    }
    ```

### Live Link

Click here: [Dev Pulse](https://dev-pulse-six-wheat.vercel.app/)
