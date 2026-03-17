import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Grape, Loader2, ShieldX } from 'lucide-react';

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);

  // Verifica e estabelece sessão com o token do convite
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const tipo = params.get('type');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token') ?? '';

    if (tipo === 'invite' && accessToken) {
      // Estabelece a sessão com o token do link antes de qualquer operação
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            setTokenValido(false);
          } else {
            setTokenValido(true);
          }
        });
    } else {
      setTokenValido(false);
    }
  }, []);

  const handleDefinirSenha = async () => {
    if (password.length < 6) {
      toast({ title: 'Senha muito curta', description: 'Mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Senhas diferentes', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Senha definida!', description: 'Bem-vindo ao VinhoTrack.' });
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Carregando verificação
  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Token inválido ou acesso direto — bloqueia
  if (!tokenValido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <ShieldX className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-xl">Acesso não autorizado</CardTitle>
            <CardDescription>
              Esta página só pode ser acessada pelo link de convite enviado por email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token válido — mostra formulário
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Grape className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">VinhoTrack</CardTitle>
          <CardDescription>Defina sua senha para ativar o acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(e) => e.key === 'Enter' && handleDefinirSenha()}
            />
          </div>
          <Button className="w-full" onClick={handleDefinirSenha} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Ativar acesso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}