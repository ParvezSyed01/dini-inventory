import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import CreateOrder from './pages/admin/CreateOrder';
import OrderList from './pages/admin/OrderList';
import FabricInventory from './pages/admin/FabricInventory';
import TaskManagement from './pages/admin/TaskManagement';
import MyTasks from './pages/worker/MyTasks';
import CreateEmployee from './pages/admin/CreateEmployee';

const Unauthorized = () => (
    <div className="p-8 text-red-500 font-bold">403 - Access Denied</div>
);

// Smart catch-all redirect based on role
function DefaultRedirect() {
    const { role } = useAuth();
    const isAdmin = role?.toLowerCase() === 'admin';
    return <Navigate to={isAdmin ? "/admin/orders" : "/my-tasks"} replace />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Admin-only Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'admin']} />}>
                        <Route element={<Layout />}>
                            <Route path="/admin/orders" element={<OrderList />} />
                            <Route path="/admin/orders/new" element={<CreateOrder />} />
                            <Route path="/admin/inventory" element={<FabricInventory />} />
                            <Route path="/admin/tasks" element={<TaskManagement />} />
                            <Route path="/admin/employees/new" element={<CreateEmployee />} />
                        </Route>
                    </Route>

                    {/* Worker Routes */}
                    <Route element={<ProtectedRoute allowedRoles={['Admin', 'admin', 'Worker', 'worker', 'Tailor', 'Staff']} />}>
                        <Route element={<Layout />}>
                            <Route path="/my-tasks" element={<MyTasks />} />
                        </Route>
                    </Route>

                    {/* Dynamic Fallback Route */}
                    <Route path="*" element={<DefaultRedirect />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}