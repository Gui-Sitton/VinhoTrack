import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MudasPage from "./pages/MudasPage";
import MudaDetailPage from "./pages/MudaDetailPage";
import NovaObservacaoPage from "./pages/NovaObservacaoPage";
import MapaVinhedoPage from "./pages/MapaVinhedoPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mudas" element={<MudasPage />} />
          <Route path="/mudas/:id" element={<MudaDetailPage />} />
          <Route path="/observacao" element={<NovaObservacaoPage />} />
          <Route path="/mapa" element={<MapaVinhedoPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
