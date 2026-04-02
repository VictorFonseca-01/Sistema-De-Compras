import { useEffect } from 'react';
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
import Settings from './pages/Settings';

function App() {
  useEffect(() => {
    // Inteligência de Tema: Forçar Dark na 1ª visita, persistir escolha depois
    const savedTheme = localStorage.getItem('theme');
    const root = window.document.documentElement;

    if (!savedTheme) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="nova-solicitacao" element={<NewRequest />} />
        <Route path="solicitacoes" element={<MyRequests />} />
        <Route path="solicitacao/:id" element={<RequestDetails />} />
        <Route path="configuracoes" element={<Settings />} />
        
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
