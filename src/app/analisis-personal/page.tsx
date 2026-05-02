
"use client"

import React, { useState, useMemo } from 'react'
import { 
  UserRound, 
  ShieldCheck, 
  UserX, 
  Sparkles, 
  Loader2, 
  PieChart as PieChartIcon,
  BrainCircuit,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts"
import { analizarPersonal, type AnalizarPersonalOutput } from '@/ai/flows/analizar-personal-flow'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection } from '@/firebase'
import { collection } from 'firebase/firestore'

const COLORS = [
  'hsl(var(--primary))', 
  'hsl(var(--accent))', 
  'hsl(var(--chart-3))', 
  'hsl(var(--chart-4))', 
  'hsl(var(--chart-5))'
];

export default function AnalisisPersonalPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [isCargandoIA, setIsCargandoIA] = useState(false)
  const [analisisIA, setAnalisisIA] = useState<AnalizarPersonalOutput | null>(null)

  const trabajadoresRef = db ? collection(db, 'trabajadores') : null
  const { data: trabajadores = [], loading: loadingData } = useCollection(trabajadoresRef)

  const stats = useMemo(() => {
    const activos = trabajadores.filter((t: any) => t.activo).length
    const inactivos = trabajadores.length - activos
    const roles = trabajadores.reduce((acc: any, t: any) => {
      const rol = t.rol || 'Sin Rol'
      acc[rol] = (acc[rol] || 0) + 1
      return acc
    }, {})

    const chartData = Object.keys(roles).map(rol => ({
      name: rol.charAt(0).toUpperCase() + rol.slice(1),
      value: roles[rol]
    }))

    return { activos, inactivos, chartData }
  }, [trabajadores])

  const manejarAnalisisIA = async () => {
    if (trabajadores.length === 0) {
      toast({
        title: "Sin datos",
        description: "Necesitas registrar trabajadores para realizar un análisis.",
        variant: "destructive"
      })
      return
    }

    setIsCargandoIA(true)
    try {
      const resultado = await analizarPersonal({
        trabajadores: trabajadores.map((t: any) => ({
          nombre: t.nombre,
          rol: t.rol,
          activo: t.activo,
          fechaRegistro: t.fechaRegistro
        }))
      })
      setAnalisisIA(resultado)
      toast({
        title: "Análisis completado",
        description: "Insights generados exitosamente por la IA.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo conectar con el motor de IA.",
        variant: "destructive"
      })
    } finally {
      setIsCargandoIA(false)
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10">
              <PieChartIcon strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Análisis de Personal</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-14">Métricas avanzadas y recomendaciones con Inteligencia Artificial.</p>
        </div>
        <Button 
          onClick={manejarAnalisisIA} 
          disabled={isCargandoIA || loadingData}
          className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-black shadow-lg h-12 rounded-2xl px-8"
        >
          {isCargandoIA ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <BrainCircuit strokeWidth={1.5} className="mr-2 h-5 w-5" />}
          Optimizar con IA
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-none bg-white shadow-sm overflow-hidden rounded-3xl">
          <CardHeader className="pb-2 px-8 pt-8">
             <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dotación Total</CardTitle>
                <div className="p-2 rounded-xl bg-primary/5 text-primary">
                    <UserRound strokeWidth={1.5} className="h-5 w-5" />
                </div>
             </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-4xl font-black text-primary">
              {loadingData ? "..." : trabajadores.length}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Colaboradores registrados</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-sm overflow-hidden rounded-3xl">
          <CardHeader className="pb-2 px-8 pt-8">
             <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actividad</CardTitle>
                <div className="p-2 rounded-xl bg-green-50 text-green-600">
                    <ShieldCheck strokeWidth={1.5} className="h-5 w-5" />
                </div>
             </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-4xl font-black text-green-600">
              {loadingData ? "..." : stats.activos}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Personal en activo</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-sm overflow-hidden rounded-3xl">
          <CardHeader className="pb-2 px-8 pt-8">
             <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Inactivos</CardTitle>
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                    <UserX strokeWidth={1.5} className="h-5 w-5" />
                </div>
             </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-4xl font-black text-red-600">
              {loadingData ? "..." : stats.inactivos}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Cuentas suspendidas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="bg-white border-none shadow-sm overflow-hidden rounded-3xl">
          <CardHeader className="p-8">
            <CardTitle className="flex items-center gap-2 text-primary font-black text-lg uppercase tracking-tight">
              <PieChartIcon strokeWidth={1.5} className="h-6 w-6" /> Distribución de Roles
            </CardTitle>
            <CardDescription className="text-xs md:text-sm font-medium">Composición jerárquica basada en cargos reales.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[400px] p-4">
            {trabajadores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={10}
                    dataKey="value"
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="stroke-none" />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <PieChartIcon strokeWidth={1} className="h-24 w-24 mb-4" />
                <p className="font-black text-xs uppercase tracking-widest">Esperando datos...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {analisisIA ? (
          <Card className="bg-primary/5 border-none shadow-xl animate-in zoom-in-95 duration-500 overflow-hidden rounded-[2.5rem] ring-1 ring-primary/10">
            <CardHeader className="p-8 md:p-10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-primary font-black text-xl">
                  <Sparkles strokeWidth={1.5} className="h-7 w-7 text-accent" /> Insights Estratégicos
                </CardTitle>
                <div className="bg-accent/20 text-accent-foreground px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                  AI Active
                </div>
              </div>
              <CardDescription className="text-primary/70 font-bold text-xs uppercase tracking-widest mt-3">Análisis dinámico de dotación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8 md:p-10 pt-0">
              <div className="text-sm leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap bg-white/60 p-8 rounded-3xl border border-primary/5 shadow-inner">
                {analisisIA.analisis}
              </div>
              <div className="space-y-5">
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                  <Target strokeWidth={2} className="h-4 w-4" /> Recomendaciones Tácticas
                </h4>
                <div className="grid gap-4">
                  {analisisIA.recomendaciones.map((rec, i) => (
                    <div key={i} className="text-xs bg-white p-5 rounded-2xl border border-primary/5 shadow-sm flex items-start gap-5 transition-all hover:shadow-md hover:-translate-y-1">
                      <span className="bg-primary text-primary-foreground h-7 w-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg">{i+1}</span>
                      <span className="font-bold text-foreground/70 leading-relaxed pt-1">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-none bg-white rounded-3xl shadow-sm">
            <div className="p-8 rounded-[2rem] bg-muted/20 mb-8">
                <BrainCircuit strokeWidth={1} className="h-24 w-24 text-muted-foreground opacity-20" />
            </div>
            <h3 className="text-2xl font-black text-muted-foreground uppercase tracking-tight">Motor de IA en espera</h3>
            <p className="text-xs text-muted-foreground/60 max-w-[320px] mt-4 font-black uppercase tracking-widest leading-loose">
              Procesa el inventario humano actual para detectar riesgos y oportunidades de gestión.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
