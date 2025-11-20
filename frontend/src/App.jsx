import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import GuestPage from './pages/shared/GuestPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import GoogleCallback from './pages/auth/GoogleCallback'
import AdminLayout from './pages/admin/AdminLayout'
import StaffLayout from './pages/staff/StaffLayout'
import NotFound from './pages/shared/NotFound'
import MapPage from './pages/driver/Map'
import DriverLayout from './pages/driver/DriverLayout'
import BookingContainer from './components/containers/BookingContainer'
import SwapHistory from './pages/driver/SwapHistory'
import Plans from './pages/driver/Plans'
import Profile from './pages/driver/Profile'
import Support from './pages/driver/Support'
import StaffDashboard from './pages/staff/Dashboard'
import StaffInventory from './pages/staff/Inventory'
import StaffInspection from './pages/staff/Inspection'
import DriverDashboard from './pages/driver/Dashboard'
import StaffSwapRequests from './pages/staff/SwapRequests'
import ManualSwapTransaction from './pages/staff/ManualSwap'
import Payment from './pages/driver/Payment'
import VerifyEmail from './pages/auth/VerifyEmail'
import ResetPassword from './pages/auth/ResetPassword'
import ForgetPassword from './pages/auth/ForgetPassword'
import AdminDashboard from './pages/admin/Dashboard'
import AdminStationList from './pages/admin/stations/StationList'
import StationDetail from './pages/admin/stations/StationDetail'
import EditStation from './pages/admin/stations/EditStation'
import CreateStation from './pages/admin/stations/CreateStation'
import CreateVehicle from './pages/admin/vehicles/CreateVehicle'
import AdminUserList from './pages/admin/users/UserList'
import UserDetail from './pages/admin/users/UserDetail'
import EditUser from './pages/admin/users/EditUser'
import CreateUser from './pages/admin/users/CreateUser'
import AdminPackageList from './pages/admin/packages/PackageList'
import PackageDetail from './pages/admin/packages/PackageDetail'
import EditPackage from './pages/admin/packages/EditPackage'
import CreatePackage from './pages/admin/packages/CreatePackage'
import AdminBatteryTransferReq from './pages/admin/battery-transfers/TransferRequestList'
import AdminBatteryTransferList from './pages/admin/battery-transfers/TransferList'
import BatteryTransferDetail from './pages/admin/battery-transfers/TransferDetail'
import EditBatteryTransfer from './pages/admin/battery-transfers/EditTransfer'
import AdminSupportList from './pages/admin/supports/SupportList'
import SupportDetail from './pages/admin/supports/SupportDetail'
import AdminReport from './pages/admin/reports/ReportDashboard'
import UnauthorizedPage from './pages/shared/UnauthorizedPage'
import StaffTransfer from './pages/staff/TransferRequests'
import CreateBattery from './pages/staff/CreateBattery'
import ReservationCountdownWidget from './components/booking/ReservationCountdownWidget'

// import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors closeButton />
      <ReservationCountdownWidget />
      {/* <Navigation /> */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<GuestPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<GoogleCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/verify-email" element={<VerifyEmail />} />
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/auth/forget-password" element={<ForgetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* Driver Routes with Nested Routing */}
        <Route path="/driver" element={<DriverLayout />}>
          {/* Route container for User */}
          <Route index element={<DriverDashboard />} />
          <Route path="booking" element={<BookingContainer />} />
          <Route path="booking/:stationId" element={<BookingContainer />} />
          <Route path="swap-history" element={<SwapHistory />} />
          <Route path="plans" element={<Plans />} />
          <Route path="map" element={<MapPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="support" element={<Support />} />
          {/* Payment Routes*/}
          <Route path="payment/success" element={<Payment />} />
          <Route path="payment/failed" element={<Payment />} />
          <Route path="payment/error" element={<Payment />} />
        </Route>

        {/* Staff Routes with Nested Routing */}
        <Route path="/staff" element={<StaffLayout />}>
          {/* Route container for Staff */}
          <Route index element={<StaffDashboard />} />
          <Route path="inventory" element={<StaffInventory />} />
          <Route path="batteries/create" element={<CreateBattery />} />
          <Route path="inspection" element={<StaffInspection />} />
          <Route path="swap-requests" element={<StaffSwapRequests />} />
          <Route path="manual-swap" element={<ManualSwapTransaction />} />
          <Route path="profile" element={<Profile />} />
          <Route path="transfer-requests" element={<StaffTransfer />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          {/* Add nested routes for Admin here */}
          <Route path="stations-list" element={<AdminStationList />} />
          <Route path="stations/create" element={<CreateStation />} />
          <Route path="stations/:id" element={<StationDetail />} />
          <Route path="stations/edit/:id" element={<EditStation />} />
          <Route path="vehicles/create" element={<CreateVehicle />} />

          <Route path="users-list" element={<AdminUserList />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="users/edit/:id" element={<EditUser />} />
          <Route path="users/create" element={<CreateUser />} />

          <Route path="packages-list" element={<AdminPackageList />} />
          <Route path="packages/edit/:id" element={<EditPackage />} />
          <Route path="packages/create" element={<CreatePackage />} />
          <Route path="packages/:id" element={<PackageDetail />} />

          <Route path="battery-transfer-requests" element={<AdminBatteryTransferList />} />
          <Route path="battery-transfer-requests/create" element={<AdminBatteryTransferReq />} />
          <Route path="battery-transfer-requests/:id" element={<BatteryTransferDetail />} />
          <Route path="battery-transfer-requests/edit/:id" element={<EditBatteryTransfer />} />

          <Route path="support-list" element={<AdminSupportList />} />
          <Route path="support/:id" element={<SupportDetail />} />

          <Route path="report" element={<AdminReport />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* 404 Not Found - Must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;