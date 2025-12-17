# SwiftRide - Vehicle Rental System

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/mongodb-compatible-green.svg)

SwiftRide is a comprehensive full-stack web application designed to streamline the vehicle rental process. It provides a seamless experience for users to browse vehicles, make bookings, and manage payments, while offering administrators powerful tools to oversee the entire operation.

<img width="1920" height="1440" alt="763shots_so" src="https://github.com/user-attachments/assets/386a0d7c-33b1-453a-9fc1-4d5f4ba6da8b" />


---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🚀 Features

### User Features

- **🔐 User Authentication**: Secure login and registration system using JWT.
- **🚗 Vehicle Browsing**: Browse available vehicles with detailed descriptions, images, and filtering options.
- **📅 Booking Management**: Easy-to-use interface for booking vehicles for specific dates.
- **💳 Payment Integration**: Secure payments powered by Stripe.
- **📜 Booking History**: View past and upcoming bookings with status updates.
- **🧾 PDF Receipts**: Generate and download professional booking receipts.

### Admin Features

- **📊 Dashboard**: Real-time overview of system statistics, revenue, and activities.
- **🛠️ Vehicle Management**: Add, edit, and remove vehicles with image uploads.
- **📝 Booking Oversight**: Manage and monitor all user bookings, approve or reject requests.
- **🏢 Branch Management**: Manage rental branch locations and availability.

---

## 💻 Tech Stack

### Frontend

- **[React](https://reactjs.org/)**: UI library for building interactive interfaces.
- **[Vite](https://vitejs.dev/)**: Next-generation frontend tooling for fast builds.
- **[TailwindCSS](https://tailwindcss.com/)**: Utility-first CSS framework for rapid and responsive UI development.
- **[Axios](https://axios-http.com/)**: Promise-based HTTP client for API communication.
- **[Chart.js](https://www.chartjs.org/)**: Simple yet flexible JavaScript charting for the admin dashboard.

### Backend

- **[Node.js](https://nodejs.org/)**: JavaScript runtime built on Chrome's V8 JavaScript engine.
- **[Express](https://expressjs.com/)**: Fast, unopinionated, minimalist web framework for Node.js.
- **[MongoDB](https://www.mongodb.com/)**: NoSQL database for flexible and scalable data storage.
- **[Mongoose](https://mongoosejs.com/)**: Elegant mongodb object modeling for node.js.

### Tools & Services

- **[Stripe](https://stripe.com/)**: Payment processing platform.
- **[Multer](https://github.com/expressjs/multer)**: Middleware for handling `multipart/form-data`, used for uploading images.
- **[JWT](https://jwt.io/)**: JSON Web Tokens for secure authentication.

---

## 📂 Project Structure

```
SwiftRide/
├── backend/                # Node.js/Express Backend
│   ├── middleware/         # Custom middleware (auth, upload, etc.)
│   ├── models/             # Mongoose models (User, Vehicle, Booking, etc.)
│   ├── routes/             # API routes
│   ├── uploads/            # Uploaded images directory
│   ├── index.js            # Entry point
│   └── ...
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── assets/         # Static assets
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React Contexts (Auth, etc.)
│   │   ├── pages/          # Application pages
│   │   ├── utils/          # Utility functions
│   │   └── ...
│   └── ...
└── README.md               # Project Documentation
```

---

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas cluster)
- [Git](https://git-scm.com/)

---

## ⚙ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/iWolfyy/SwiftRide.git
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

---

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file in the `backend` folder:

| Variable            | Description                                        |
| :------------------ | :------------------------------------------------- |
| `PORT`              | Port number for the backend server (default: 5555) |
| `mongoDBURL`        | Connection string for your MongoDB database        |
| `STRIPE_SECRET_KEY` | Secret key from your Stripe dashboard              |

---

## 📡 API Endpoints

The backend exposes the following main API endpoints:

| Method | Endpoint         | Description               |
| :----- | :--------------- | :------------------------ |
| `POST` | `/auth/login`    | User login                |
| `POST` | `/auth/register` | User registration         |
| `GET`  | `/vehicles`      | Get all vehicles          |
| `POST` | `/vehicles`      | Add a new vehicle (Admin) |
| `GET`  | `/bookings`      | Get all bookings          |
| `POST` | `/bookings`      | Create a new booking      |
| `POST` | `/payments`      | Process payment           |

---

## 🤝 Contributing

Contributions are always welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

## 📧 Contact

Project Link: [https://github.com/iWolfyy/SwiftRide](https://github.com/iWolfyy/SwiftRide)
