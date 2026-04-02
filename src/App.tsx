import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NewRequest from './pages/NewRequest';
import MyRequests from './pages/MyRequests';
import RequestDetails from './pages/RequestDetails';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';


function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="nova-solicitacao" element={<NewRequest />} />
        <Route path="solicitacoes" element={<MyRequests />} />
        <Route path="solicitacao/:id" element={<RequestDetails />} />
        
        {/* Rotas Restritas: Admin e TI */}
        <Route element={<ProtectedRoute allowedRoles={['master_admin']} />}>
          <Route path="admin" element={<AdminPanel />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['master_admin']} />}>
          <Route path="admin" element={<AdminPanel />} />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
    </Routes>
  );
}

export default App;
