// import { useAuth } from "../../hooks/useAuth";
// import { Navigate } from "react-router-dom";

// export default function ProtectedRoute({ children, allowedRoles }) {
//   const { user, isAuthenticated } = useAuth();

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   // Nếu có allowedRoles và user.role không nằm trong đó → chặn
//   if (allowedRoles && !allowedRoles.includes(user.role)) {
//     return <Navigate to="/" replace />;
//   }

//   return children;
// }