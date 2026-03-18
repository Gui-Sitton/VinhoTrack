import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AuthRoute } from '@/components/ProtectedRoute';
import HomePage from "./pages/HomePage";
import MudasPage from "./pages/MudasPage";
import MudaDetailPage from "./pages/MudaDetailPage";
import NovaObservacaoPage from "./pages/NovaObservacaoPage";
import MapaVinhedoPage from "./pages/MapaVinhedoPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import AplicacoesPage from "./pages/AplicacoesPage";
import IrrigacoesPage from "./pages/IrrigacoesPage";
import AuthPage from "./pages/AuthPage";
import ReferenciasFenologicasPage from "./pages/ReferenciasFenologicasPage";
import NotFound from "./pages/NotFound";
import ClimaPage from "./pages/ClimaPage.tsx";
import SessaoObservacaoPage from '@/pages/SessaoObservacaoPage.tsx';
import AcceptInvitePage from './pages/AcceptInvitePage';
import CadastroTalhaoPage from './pages/CadastroTalhaoPage.tsx';
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/accept-invite" element={<AcceptInvitePage />} />
            <Route path="/mudas" element={<ProtectedRoute><MudasPage /></ProtectedRoute>} />
            <Route path="/setup" element={<AuthRoute><CadastroTalhaoPage /></AuthRoute>} />
            <Route path="/mudas/:id" element={<ProtectedRoute><MudaDetailPage /></ProtectedRoute>} />
            <Route path="/observacao" element={<SessaoObservacaoPage />} />
            <Route path="/mapa" element={<ProtectedRoute><MapaVinhedoPage /></ProtectedRoute>} />
            <Route path="/aplicacoes" element={<ProtectedRoute><AplicacoesPage /></ProtectedRoute>} />
            <Route path="/irrigacoes" element={<ProtectedRoute><IrrigacoesPage /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
            <Route path="/clima" element={<ProtectedRoute><ClimaPage /></ProtectedRoute>} />
            <Route path="/referencias-fenologicas" element={<ProtectedRoute><ReferenciasFenologicasPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
