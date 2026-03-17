import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Grape, Loader2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
});

export default function AuthPage() {
  const { user, isLoading, signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast({
        title: 'Erro de validação',
        description: result.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        let message = 'Erro ao fazer login';
        if (error.message.includes('Invalid login credentials')) message = 'Email ou senha incorretos';
        else if (error.message.includes('Email not confirmed')) message = 'Confirme seu email antes de fazer login';
        toast({ title: 'Erro', description: message, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Grape className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">VinhoTrack</CardTitle>
          <CardDescription>Gestão inteligente do seu vinhedo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button className="w-full" onClick={handleLogin} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Entrar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}