# SwiftRide - Vehicle Rental System

SwiftRide is a comprehensive full-stack web application designed to streamline the vehicle rental process. It provides a seamless experience for users to browse vehicles, make bookings, and manage payments, while offering administrators powerful tools to oversee the entire operation.

## Features

### User Features

- **User Authentication**: Secure login and registration system.
- **Vehicle Browsing**: Browse available vehicles with detailed descriptions and images.
- **Booking Management**: Easy-to-use interface for booking vehicles.
- **Payment Integration**: Secure payments powered by Stripe.
- **Booking History**: View past and upcoming bookings.
- **PDF Receipts**: Generate and download booking receipts.

### Admin Features

- **Dashboard**: Overview of system statistics and activities.
- **Vehicle Management**: Add, edit, and remove vehicles.
- **Booking Oversight**: Manage and monitor all user bookings.
- **Branch Management**: Manage rental branch locations.

## Tech Stack

### Frontend

- **React**: UI library for building interactive interfaces.
- **Vite**: Next-generation frontend tooling.
- **TailwindCSS**: Utility-first CSS framework for rapid UI development.
- **Axios**: Promise-based HTTP client for the browser and node.js.
- **Chart.js**: Simple yet flexible JavaScript charting for the admin dashboard.

### Backend

- **Node.js**: JavaScript runtime built on Chrome's V8 JavaScript engine.
- **Express**: Fast, unopinionated, minimalist web framework for Node.js.
- **MongoDB**: NoSQL database for flexible and scalable data storage.
- **Mongoose**: Elegant mongodb object modeling for node.js.

### Tools & Services

- **Stripe**: Payment processing platform.
- **Multer**: Middleware for handling `multipart/form-data`, used for uploading images.
- **JWT**: JSON Web Tokens for secure authentication.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas cluster)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SwiftRide
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5555
mongoDBURL=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
```

Start the backend server:

```bash
npm start
# OR for development with nodemon
npm run dev
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

## API Endpoints

The backend exposes the following main API endpoints:

- **/auth**: User authentication (login, register).
- **/vehicles**: CRUD operations for vehicles.
- **/bookings**: Manage bookings.
- **/payments**: Handle payment processing.
- **/admin**: Admin-specific routes.
- **/branches**: Manage branch locations.

## License

This project is licensed under the ISC License.
