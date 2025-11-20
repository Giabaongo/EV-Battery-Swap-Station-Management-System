import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import GuestPage from './pages/GuestPage'
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import GoogleCallback from './components/auth/GoogleCallback'
import AdminPage from './pages/admin/AdminPage'
import StaffPage from './pages/StaffPage'
import NotFound from './pages/NotFound'
import MapPage from './pages/Map'
import Driver from './pages/Driver'
import BookingContainer from './components/containers/BookingContainer'
import SwapHistory from './pages/SwapHistory'
import Plans from './pages/Plans'
import Profile from './pages/Profile'
import Support from './pages/Support'
import StaffDashboard from './components/dashboard/StaffDashboard'
import StaffInventory from './components/dashboard/StaffInventory'
import StaffInspection from './components/dashboard/StaffInspection'
import User from './pages/User'
import StaffSwapRequests from './components/swap/StaffSwapRequests'
import ManualSwapTransaction from './components/swap/ManualSwapTransaction'
import Payment from './pages/Payment'
import VerifyEmail from './pages/VerifyEmail'
import ResetPassword from './pages/ResetPassword'
import ForgetPassword from './pages/ForgetPassword'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStationList from './pages/admin/AdminStationList'
import AdminUserList from './pages/admin/AdminUserList'
import AdminPackageList from './pages/admin/AdminPackageList'
import AdminBatteryTransferReq from './pages/admin/AdminBatteryTransferReq'
import BatteryTransferDetail from './pages/admin/BatteryTransferDetail'
import AdminBatteryTransferList from './pages/admin/AdminBatteryTransferList'
import EditBatteryTransfer from './pages/admin/EditBatteryTransfer'
import AdminSupportList from './pages/admin/AdminSupportList'
import AdminReport from './pages/admin/AdminReport'
import StationDetail from './pages/admin/StationDetail'
import EditStation from './pages/admin/EditStation'
import CreateStation from './pages/admin/CreateStation'
import UserDetail from './pages/admin/UserDetail'
import EditUser from './pages/admin/EditUser'
import CreateUser from './pages/admin/CreateUser'
import EditPackage from './pages/admin/EditPackage'
import CreatePackage from './pages/admin/CreatePackage'
import PackageDetail from './pages/admin/PackageDetail'
import StaffTransfer from './components/dashboard/StaffTransfer'
import CreateBattery from './components/dashboard/CreateBattery'
import SupportDetail from './pages/admin/SupportDetail'

// import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors closeButton />
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
        <Route path="/driver" element={<Driver />}>
          {/* Route container for User */}
          <Route index element={<User />} />
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
        <Route path="/staff" element={<StaffPage />}>
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
        <Route path="/admin" element={<AdminPage />}>
          <Route index element={<AdminDashboard />} />
          {/* Add nested routes for Admin here */}
          <Route path="stations-list" element={<AdminStationList />} />
          <Route path="stations/create" element={<CreateStation />} />
          <Route path="stations/:id" element={<StationDetail />} />
          <Route path="stations/edit/:id" element={<EditStation />} />

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