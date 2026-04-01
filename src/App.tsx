import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NewRequest from './pages/NewRequest';
import MyRequests from './pages/MyRequests';
import RequestDetails from './pages/RequestDetails';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import Inventory from './pages/Inventory';
import AssetDetails from './pages/AssetDetails';
import AssetDelivery from './pages/AssetDelivery';
import AssetImport from './pages/AssetImport';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="nova-solicitacao" element={<NewRequest />} />
        <Route path="solicitacoes" element={<MyRequests />} />
        <Route path="solicitacao/:id" element={<RequestDetails />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="estoque" element={<Inventory />} />
        <Route path="estoque/:id" element={<AssetDetails />} />
        <Route path="entregar" element={<AssetDelivery />} />
        <Route path="importar-estoque" element={<AssetImport />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
    </Routes>
  );
}

export default App;
