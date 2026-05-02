
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Warehouse, Shield, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workerId, setWorkerId] = useState('');

  const workersRef = useMemoFirebase(() => db ? collection(db, 'trabajadores') : null, [db]);
  const { data: workers = [] } = useCollection(workersRef);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);

    try {
      // Intento en colección 'usuarios' (Admin/Gestor)
      const q = query(collection(db, 'usuarios'), where('email', '==', email), where('password', '==', password));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        login({
          id: snapshot.docs[0].id,
          nombre: userData.nombre,
          correo: userData.email,
          role: userData.role,
        });
        toast({ title: 'Bienvenido', description: `Sesión iniciada como ${userData.role}` });
      } else {
        toast({ title: 'Error de acceso', description: 'Credenciales inválidas.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo conectar con el servidor.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerLogin = () => {
    const worker = workers.find((w: any) => w.id === workerId);
    if (worker) {
      login({
        id: worker.id,
        nombre: worker.nombre,
        correo: worker.correo,
        role: 'Trabajador',
      });
      toast({ title: 'Sesión Iniciada', description: `Hola, ${worker.nombre}` });
    } else {
      toast({ title: 'Error', description: 'Selecciona un trabajador válido.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8 animate-in fade-in duration-700">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-3xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/20">
            <Warehouse className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-primary">Gestor Stock</h1>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Acceso al Sistema</p>
          </div>
        </div>

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-2xl bg-muted/50 p-1">
            <TabsTrigger value="admin" className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Shield className="mr-2 h-4 w-4" /> Gestión
            </TabsTrigger>
            <TabsTrigger value="worker" className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <User className="mr-2 h-4 w-4" /> Personal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin">
            <Card className="border-none shadow-2xl bg-white rounded-[2rem] overflow-hidden mt-4">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black text-primary">Acceso Administrativo</CardTitle>
                <CardDescription className="font-medium">Ingresa tus credenciales corporativas.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo Electrónico</Label>
                    <Input 
                      type="email" 
                      placeholder="email@empresa.com" 
                      className="h-12 rounded-xl font-bold"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 rounded-xl"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-primary font-black uppercase tracking-widest shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Entrar al Panel'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="worker">
            <Card className="border-none shadow-2xl bg-white rounded-[2rem] overflow-hidden mt-4">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black text-primary">Acceso de Operario</CardTitle>
                <CardDescription className="font-medium">Selecciona tu nombre para registrar movimientos.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trabajador</Label>
                    <Select value={workerId} onValueChange={setWorkerId}>
                      <SelectTrigger className="h-14 rounded-2xl font-bold">
                        <SelectValue placeholder="¿Quién eres?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {workers.map((w: any) => (
                          <SelectItem key={w.id} value={w.id} className="py-3 font-bold">{w.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleWorkerLogin} className="w-full h-14 rounded-2xl bg-accent font-black uppercase tracking-widest shadow-lg shadow-accent/20" disabled={!workerId}>
                    Iniciar Turno
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
          © 2024 Gestor Stock Enterprise
        </p>
      </div>
    </div>
  );
}
