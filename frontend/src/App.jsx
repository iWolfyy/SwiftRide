import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';


// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import BranchManagerDashboard from './pages/BranchManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import MyVehicles from './pages/MyVehicles';
import VehicleList from './pages/VehicleList';
import VehicleDetails from './pages/VehicleDetails';
import BookingForm from './pages/BookingForm';
import BookingSuccess from './pages/BookingSuccess';
import BookingDetails from './pages/BookingDetails';
import Branches from './pages/Branches';
import Unauthorized from './pages/Unauthorized';
import SavedCards from './pages/SavedCards';
import PaymentHistory from './pages/PaymentHistory';

// Existing book pages (keeping for backwards compatibility)
import CreateBooks from './pages/CreateBooks';
import ShowBook from './pages/ShowBook';
import EditBook from './pages/EditBook';
import DeleteBook from './pages/DeleteBook';

const App = () => {
  return (
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/vehicles/:id" element={<VehicleDetails />} />
            <Route path="/branches" element={<Branches />} />
            <Route path="/booking-success" element={<BookingSuccess />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes - Customer */}
            <Route
              path="/customer-dashboard"
              element={
                <ProtectedRoute roles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-cards"
              element={
                <ProtectedRoute roles={['customer']}>
                  <SavedCards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-history"
              element={
                <ProtectedRoute roles={['customer']}>
                  <PaymentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book/:id"
              element={
                <ProtectedRoute roles={['customer']}>
                  <BookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking/:id"
              element={
                <ProtectedRoute roles={['customer']}>
                  <BookingDetails />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Seller */}
            <Route
              path="/seller-dashboard"
              element={
                <ProtectedRoute roles={['seller']}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-vehicle"
              element={
                <ProtectedRoute roles={['seller']}>
                  <AddVehicle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-vehicles"
              element={
                <ProtectedRoute roles={['seller']}>
                  <MyVehicles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicles/edit/:id"
              element={
                <ProtectedRoute roles={['seller']}>
                  <EditVehicle />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Branch Manager */}
            <Route
              path="/branch-manager-dashboard"
              element={
                <ProtectedRoute roles={['branch-manager']}>
                  <BranchManagerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Admin */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Existing book routes (keeping for backwards compatibility) */}
            <Route
              path="/books/create"
              element={
                <ProtectedRoute>
                  <CreateBooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/details/:id"
              element={
                <ProtectedRoute>
                  <ShowBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/edit/:id"
              element={
                <ProtectedRoute>
                  <EditBook />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/delete/:id"
              element={
                <ProtectedRoute>
                  <DeleteBook />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-4">Page not found</p>
                    <a href="/" className="text-blue-600 hover:text-blue-500">
                      Go back home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </SnackbarProvider>
  );
};

export default App;
