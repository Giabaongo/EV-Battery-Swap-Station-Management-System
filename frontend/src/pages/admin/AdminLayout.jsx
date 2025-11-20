import { Outlet } from "react-router-dom";
import Navigation from "../../components/layout/Navigation";
import { useAuth } from "../../hooks/useContext";

export default function AdminPage() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* Aurora Dream Diagonal Flow Background */}
            <div
                className="fixed inset-0 z-0"
                style={{
                    background: `
                        radial-gradient(ellipse 80% 60% at 5% 40%, #ecf1fbdc, transparent 67%),
                        radial-gradient(ellipse 70% 60% at 45% 45%, #eaf1ff69, transparent 67%),
                        radial-gradient(ellipse 62% 52% at 83% 76%, #f7fbffff, transparent 63%),
                        radial-gradient(ellipse 60% 48% at 75% 20%, #dde5ffbc, transparent 66%),
                        linear-gradient(45deg, #eaeeffc5 0%, #ffffffff 100%)
                    `,
                }}
            />

            {/* Navigation */}
            <div className="relative z-10">
                <Navigation type="admin" />
            </div>

            {/* Main Content */}
            <main className="relative z-5 p-6 pl-64">
                {/* Trang con sẽ render ở đây */}
                <Outlet />
            </main>
        </div>
    );
}