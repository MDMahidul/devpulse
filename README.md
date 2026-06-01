# Dev Pulse

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
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
- PostgreSQL database (local, NeonDB)
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

- **Update Bike (Admin Only)**
  - **Route**: /api/bikes/:id (PUT)
  - **Request Headers**: Authorization: Bearer jwt_token
  - **Request Body**:
    ```json
    {
      "pricePerHour": 20
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "statusCode": 200,
      "message": "Bike updated successfully",
      "data": {
        "_id": "bike_id",
        "name": "Mountain Bike",
        "description": "A durable mountain bike for rough terrains.",
        "pricePerHour": 20, // Updated price per hour
        "isAvailable": true,
        "cc": 250,
        "year": "2022",
        "model": "X1",
        "brand": "Yamaha",
        "image": "image_link",
        "mileage": "50",
        "createdAt": "2024-06-10T13:26:51.289Z",
        "updatedAt": "2024-06-10T13:26:51.289Z",
        "__v": 0
      }
    }
    ```
- **Delete Bike (Admin Only)**
  - **Route**: /api/bikes/:id (DELETE)
  - **Request Headers**: Authorization: Bearer jwt_token
  - **Response**:
    ```json
    {
      "success": true,
      "statusCode": 200,
      "message": "Bike deleted successfully",
      "data": {
        "_id": "bike_id",
        "name": "Mountain Bike",
        "description": "A durable mountain bike for rough terrains.",
        "pricePerHour": 20,
        "isAvailable": false,
        "cc": 250,
        "year": "2022",
        "model": "X1",
        "brand": "Yamaha",
        "image": "image_link",
        "mileage": "50",
        "createdAt": "2024-06-10T13:26:51.289Z",
        "updatedAt": "2024-06-10T13:26:51.289Z",
        "__v": 0
      }
    }
    ```

## Error Handling

Errors are handled using custom error classes and middleware. Common errors include:

- **Not Found Route**:
  - Implemented a global "Not Found" handler for unmatched routes. When a route is not found, it will respond with a generic message: "Not Found."
  - **Response**:
    `json
{
  "success": false,
  "statusCode": 404,
  "message": "Not Found"
}
`
- **Authentication Middleware:**

  - Implemented an Authentication Middleware to authenticate the application. Ensured that only user and admin can access their own accessible routes.
  - **Response**

    ```json
    {
      "success": false,
      "statusCode": 401,
      "message": "You have no access to this route"
    }
    ```

- **Error Handling**:

  - Implemented error handling throughout the application. Used global error handling middleware to catch and handle errors, providing appropriate error responses error messages.
  - **Sample Error Response**:
    ```json
    {
      "success": false,
      "message": "Duplicate Data found!",
      "errorMessages": [
        {
          "path": "",
          "message": "mahi@example.com is already exist"
        }
      ],
      "stack": "error stack"
    }
    ```
    
### Live Link

Click here: [Dev Pulse](https://dev-pulse-six-wheat.vercel.app/)
