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
import Inventory from './pages/Inventory';
import AssetImport from './pages/AssetImport';
import AssetDetails from './pages/AssetDetails';
import NewAsset from './pages/NewAsset';
import AssetDelivery from './pages/AssetDelivery';
import Reports from './pages/Reports';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="solicitacoes" element={<MyRequests />} />
        <Route path="solicitacoes/nova" element={<NewRequest />} />
        <Route path="solicitacoes/nova" element={<NewRequest />} />
        <Route path="solicitacoes/:id" element={<RequestDetails />} />
        <Route path="configuracoes" element={<Settings />} />
        <Route path="estoque" element={<Inventory />} />
        <Route path="estoque/:id" element={<AssetDetails />} />
        
        {/* Rotas de Gestão Restrita (TI/Compras/Diretoria) */}
        <Route element={<ProtectedRoute allowedRoles={['master_admin', 'ti', 'compras', 'gestor', 'diretoria']} />}>
          <Route path="novo-ativo" element={<NewAsset />} />
          <Route path="entrega-ativo" element={<AssetDelivery />} />
          <Route path="importar-estoque" element={<AssetImport />} />
          <Route path="relatorios" element={<Reports />} />
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
