# EV Battery Swap Station Management System

## Table of contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder structure](#folder-structure)
- [Setup and installation](#setup-and-installation)
- [Running application](#running-application)
- [Frontend details](#frontend-details)
- [Backend details](#backend-details)
- [License](#license)

## Overview
The EV Battery Swap Station Management System is a comprehensive web platform designed to manage electric vehicle battery swap stations. The system provides an efficient solution for managing battery inventory, swap transactions, user subscriptions, payment processing, and station operations. It serves three main user roles: Drivers (customers), Staff (station operators), and Admins (system administrators).

With the rapid growth of electric vehicles, our platform aims to streamline the battery swapping process, allowing EV users to quickly exchange depleted batteries for fully charged ones at designated swap stations. The system also includes booking functionality, real-time battery tracking, payment integration with VNPAY and MoMo, and comprehensive reporting features.

## Features
- **User Management**: Complete authentication system with role-based access control (Admin, Staff, Driver) using JWT tokens.
- **Station Management**: Real-time monitoring and management of battery swap stations, including location tracking and operational status.
- **Battery Inventory**: Track battery status (available, charging, in_use, maintenance), health levels, and charging cycles across multiple stations.
- **Swap Transactions**: Full transaction lifecycle management from reservation to completion, with history tracking and reporting.
- **Subscription System**: Flexible service packages for users with different swap quotas and pricing tiers.
- **Payment Integration**: Seamless payment processing via VNPAY and MoMo payment gateways with automatic subscription renewal.
- **Booking System**: Users can reserve swap slots at specific stations with time scheduling and station availability checking.
- **Configuration Management**: Admin interface to manage system configurations including fees, penalties, and deposit amounts.
- **Real-time Updates**: WebSocket integration for live battery status updates and transaction notifications.
- **Support System**: Ticket management for customer support requests and issue tracking.
- **Battery Transfer**: Inter-station battery relocation system to optimize inventory distribution.
- **Reports & Analytics**: Comprehensive dashboard with swap statistics, revenue tracking, and station performance metrics.

## Tech Stack
- **Frontend Tech**: Vite + React, Formik, Yup, Tailwind CSS, shadcn/ui, React Router, lucide-react, axios, socket.io-client, react-toastify, recharts
- **Backend Tech**: Node.js, NestJS, TypeScript, Prisma ORM, PostgreSQL, jsonwebtoken, bcrypt, cors, class-validator, class-transformer, socket.io, nodemailer

## Folder structure
```
├─ backend/
│    └──   prisma/              # Database schema and migrations
│    └──   src/
│         └──   modules/
│               └──   auth/     # Authentication & authorization
│               └──   users/    # User management
│               └──   stations/ # Station operations
│               └──   batteries/ # Battery tracking
│               └──   vehicles/ # Vehicle management
│               └──   subscriptions/ # Service packages
│               └──   payments/ # VNPAY/MoMo integration
│               └──   swapping/ # Swap transaction logic
│               └──   swap-transactions/ # Transaction history
│               └──   reservations/ # Booking system
│               └──   supports/ # Customer support tickets
│               └──   config/   # System configurations
│               └──   cabinets/ # Battery cabinet management
│               └──   battery-transfer-ticket/ # Inter-station transfers
│         └──   common/         # Shared utilities and guards
│         └──   app.module.ts
│         └──   main.ts
│    └──   docs/               # API documentation
│    └──   ...
├─ frontend/
│    └──   public/             # Static assets (logo, images)
│    └──   src/
│         └──   components/     # Reusable UI components
│               └──   ui/       # shadcn/ui components
│               └──   layout/   # Layout components
│               └──   map/      # Map integration
│               └──   swap/     # Swap-related components
│         └──   pages/          # Page components
│               └──   admin/    # Admin dashboard pages
│               └──   driver/   # Driver interface pages
│               └──   staff/    # Staff interface pages
│         └──   services/       # API service layer
│         └──   utils/          # Utility functions
│         └──   context/        # React context providers
│         └──   App.jsx
│         └──   ...
├─ ai-chat-log/                # Development documentation
├─ README.md
├─ ...
```

## Setup and Installation

### Prerequisites
- Node.js (v18+ or later)
- npm or yarn
- PostgreSQL (v14+ or later)

### Setup and installation

1. **Clone or download the project from GitHub**
   ```bash
   git clone <repository-url>
   cd EV-Battery-Swap-Station-Management-System
   ```

2. **Check Node.js installation**
   ```bash
   node -v 
   # Should output version 18 or higher
   ```

3. **Set up PostgreSQL Database**
   - Install PostgreSQL on your local machine
   - Create a new database for the project
   - Update database credentials in backend `.env` file

## Running application

### Backend installation and running

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install missing dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env` file in the backend root directory
   - Add required environment variables (database URL, JWT secrets, payment gateway credentials)

4. **Run Prisma migrations**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the backend server**
   ```bash
   npm run start:dev
   ```

7. **Once the message "Application is running on..." appears, backend is ready**

**Backend runs on port 3000 by default with the address:**
```
http://localhost:3000
```

**API documentation is available at:**
```
http://localhost:3000/api
```

### Frontend installation and running

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install missing dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create a `.env` file in the frontend root directory
   - Add backend API URL

4. **Start the frontend development server**
   ```bash
   npm run dev
   ```

5. **Press `O` key or open browser manually**

**Frontend runs on port 5173 by default with the address:**
```
http://localhost:5173
```

## Frontend details
The frontend is built with React and Vite for fast development and optimal production builds. It features a modern, responsive UI using Tailwind CSS and shadcn/ui components. The application is organized into three main interfaces:

- **Driver Interface**: Booking stations, viewing swap history, managing subscriptions, and tracking battery status
- **Staff Interface**: Processing swap transactions, managing battery inventory, handling support tickets
- **Admin Interface**: User management, station configuration, system settings, reports and analytics

Key frontend features include:
- Form validation with Formik and Yup
- State management using React Context API
- API integration with axios interceptors for authentication
- Real-time updates via Socket.IO
- Interactive maps for station location
- Responsive design for mobile and desktop

## Backend details
The backend is built with NestJS, a progressive Node.js framework that provides a solid architectural foundation. It uses TypeScript for type safety and Prisma ORM for database management with PostgreSQL.

Key backend features include:
- RESTful API architecture with clear module separation
- JWT-based authentication and role-based authorization guards
- Prisma ORM for type-safe database queries
- Real-time WebSocket connections for live updates
- Payment gateway integrations (VNPAY, MoMo)
- Email notifications via Nodemailer
- Comprehensive validation using class-validator
- Error handling and logging
- Database seeding and migration scripts

The API follows best practices with proper DTOs (Data Transfer Objects), service layer separation, and comprehensive error handling. All endpoints are secured with JWT authentication and role-based guards.

## License
UNLICENSED - Private project for educational purposes.
