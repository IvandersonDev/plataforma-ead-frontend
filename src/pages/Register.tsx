import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { GraduationCap, X } from 'lucide-react';

export default function Register() {
  const [tipo, setTipo] = useState<'aluno' | 'professor'>('aluno');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [anexoTexto, setAnexoTexto] = useState('');
  const [anexoArquivo, setAnexoArquivo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !email || !senha) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }

    if (senha.length < 6) {
      toast.error('A senha deve ter no minimo 6 caracteres');
      return;
    }

    if (tipo === 'professor' && !anexoArquivo && !anexoTexto.trim()) {
      toast.error('Professores devem anexar o comprovante (PDF) ou informar URL/descricao.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        nome,
        email,
        senha,
        tipo,
        anexo: anexoTexto.trim() || null,
        anexoFile: anexoArquivo,
      });
      toast.success('Cadastro realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-3xl">Criar Conta</CardTitle>
          <CardDescription>Escolha seu perfil e comece a aprender</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tipo} onValueChange={(v) => setTipo(v as 'aluno' | 'professor')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="aluno">Aluno</TabsTrigger>
              <TabsTrigger value="professor">Professor</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              <TabsContent value="professor" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="arquivoComprovante">Comprovante em PDF</Label>
                  <Input
                    id="arquivoComprovante"
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      if (file && file.type !== 'application/pdf') {
                        toast.error('Envie apenas arquivos PDF.');
                        event.target.value = '';
                        setAnexoArquivo(null);
                        return;
                      }
                      setAnexoArquivo(file);
                    }}
                  />
                  {anexoArquivo && (
                    <div className="flex items-center justify-between rounded bg-muted px-3 py-2 text-xs">
                      <span>{anexoArquivo.name}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setAnexoArquivo(null)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Aceitamos apenas arquivos PDF.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anexoTexto">URL ou descricao do comprovante</Label>
                  <Textarea
                    id="anexoTexto"
                    placeholder="Ex: https://drive.google.com/... ou uma breve descricao do documento"
                    value={anexoTexto}
                    onChange={(e) => setAnexoTexto(e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Informe a URL do documento ou descreva sua experiencia. Caso tenha anexado o PDF, este campo e
                    opcional.
                  </p>
                </div>
              </TabsContent>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </form>
          </Tabs>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Ja tem uma conta? </span>
            <Link to="/login" className="text-primary hover:underline">
              Fazer login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
