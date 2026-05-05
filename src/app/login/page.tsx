'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, User, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCollection, useMemoFirebase } from '@/firebase';

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [workerId, setWorkerId] = useState('');

  const trabajadoresRef = useMemoFirebase(() => db ? collection(db, 'trabajadores') : null, [db]);
  const { data: workersData } = useCollection(trabajadoresRef);
  const workers = workersData || [];

  useEffect(() => {
    if (!db) return;
    const repairAccount = async () => {
      try {
        const q = query(collection(db, 'trabajadores'), where('nombre', 'in', ['Mauricio Fabián reyes Jiménez', 'Mauricio Fabián Reyes Jiménez']));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docRef = snap.docs[0].ref;
          const data = snap.docs[0].data();
          await setDoc(doc(db, 'usuarios', docRef.id), {
            email: data.correo || 'mauricio@admin.com',
            password: data.password || '1234',
            nombre: data.nombre,
            role: 'Administrador'
          }, { merge: true });
        }
      } catch (e) {}
    };
    repairAccount();
  }, [db]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);
    try {
      let q = query(collection(db, 'usuarios'), where('email', '==', identifier), where('password', '==', password));
      let snapshot = await getDocs(q);
      if (snapshot.empty) {
        q = query(collection(db, 'usuarios'), where('nombre', '==', identifier), where('password', '==', password));
        snapshot = await getDocs(q);
      }
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        login({ id: snapshot.docs[0].id, nombre: userData.nombre, correo: userData.email, role: userData.role as any });
        toast({ title: 'Bienvenido', description: `Sesión iniciada como ${userData.role}` });
      } else {
        toast({ title: 'Acceso denegado', description: 'Usuario o contraseña incorrectos.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error de conexión', description: 'No se pudo verificar la cuenta.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerLogin = () => {
    const worker = workers.find((w: any) => w.id === workerId);
    if (worker) {
      login({ id: worker.id, nombre: worker.nombre, correo: worker.correo, role: 'Trabajador' });
      toast({ title: 'Sesión Iniciada', description: `Hola, ${worker.nombre}` });
    } else {
      toast({ title: 'Error', description: 'Selecciona un trabajador válido.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F7FA] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full -ml-48 -mb-48 blur-3xl" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-20 w-20 rounded-[2rem] bg-white flex items-center justify-center shadow-xl shadow-black/5 p-3">
            <Image src="/images/logo.jpeg" alt="SyncStock Logo" width={60} height={60} className="object-contain" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-secondary">SyncStock</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-1">Gestión de Inventarios</p>
          </div>
        </div>

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-2xl bg-white/80 backdrop-blur-sm p-1 shadow-sm border border-border">
            <TabsTrigger value="admin" className="rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-secondary data-[state=active]:text-white transition-all">
              <Shield className="mr-2 h-3.5 w-3.5" /> Gestión
            </TabsTrigger>
            <TabsTrigger value="worker" className="rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
              <User className="mr-2 h-3.5 w-3.5" /> Personal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="mt-6">
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4 text-center">
                <CardTitle className="text-xl font-bold text-secondary">Acceso Administrativo</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">Panel de control y reportes</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Usuario / Email</Label>
                    <Input 
                      placeholder="nombre@empresa.com" 
                      className="h-12 rounded-xl border-border bg-[#F5F7FA] font-medium focus-visible:ring-secondary"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Contraseña</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-12 rounded-xl border-border bg-[#F5F7FA] focus-visible:ring-secondary"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-secondary hover:bg-accent text-white font-bold uppercase tracking-widest shadow-lg shadow-secondary/20 transition-all hover:scale-[1.02]" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                      <>
                        Entrar al Panel <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="worker" className="mt-6">
            <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4 text-center">
                <CardTitle className="text-xl font-bold text-primary">Acceso Personal</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground">Registro de movimientos diarios</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Selecciona tu Perfil</Label>
                    <Select value={workerId} onValueChange={setWorkerId}>
                      <SelectTrigger className="h-14 rounded-2xl bg-[#F5F7FA] border-border font-semibold">
                        <SelectValue placeholder="¿Quién eres?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {(workers || []).map((w: any) => (
                          <SelectItem key={w.id} value={w.id} className="py-3 font-semibold">{w.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleWorkerLogin} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]" disabled={!workerId}>
                    Iniciar Turno <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
          © 2024 SyncStock Inventario · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}