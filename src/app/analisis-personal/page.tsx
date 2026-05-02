
"use client"

import React, { useState, useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Sparkles, 
  Loader2, 
  BrainCircuit,
  Target,
  Zap,
  Users,
  Box,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid } from "recharts"
import { analizarPersonal, type AnalizarPersonalOutput } from '@/ai/flows/analizar-personal-flow'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useCollection } from '@/firebase'
import { collection } from 'firebase/firestore'
import { useMemoFirebase } from '@/firebase/use-memo-firebase'
import { Badge } from '@/components/ui/badge'

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

  const trabajadoresRef = useMemoFirebase(() => db ? collection(db, 'trabajadores') : null, [db])
  const movimientosRef = useMemoFirebase(() => db ? collection(db, 'movimientos') : null, [db])

  const { data: trabajadores = [], loading: loadingTrab } = useCollection(trabajadoresRef)
  const { data: movimientos = [], loading: loadingMov } = useCollection(movimientosRef)

  const stats = useMemo(() => {
    const statsMap: Record<string, { 
      nombre: string, 
      rol: string, 
      totalMovimientos: number, 
      volumenTotal: number, 
      materiales: Set<string> 
    }> = {}

    trabajadores.forEach((t: any) => {
      statsMap[t.id] = {
        nombre: t.nombre,
        rol: t.rol,
        totalMovimientos: 0,
        volumenTotal: 0,
        materiales: new Set()
      }
    })

    movimientos.forEach((m: any) => {
      if (m.trabajadorId && statsMap[m.trabajadorId]) {
        statsMap[m.trabajadorId].totalMovimientos += 1
        statsMap[m.trabajadorId].volumenTotal += Number(m.cantidad || 0)
        if (m.materialId) statsMap[m.trabajadorId].materiales.add(m.materialId)
      }
    })

    const dataArray = Object.values(statsMap).map(s => ({
      ...s,
      materialesDistintos: s.materiales.size
    })).sort((a, b) => b.volumenTotal - a.volumenTotal)

    const top5 = dataArray.slice(0, 5)
    const volumenTotalGlobal = movimientos.reduce((acc: number, m: any) => acc + Number(m.cantidad || 0), 0)

    return { 
      dataArray, 
      top5, 
      volumenTotalGlobal,
      totalMovimientosGlobal: movimientos.length
    }
  }, [trabajadores, movimientos])

  const manejarAnalisisIA = async () => {
    if (movimientos.length === 0) {
      toast({
        title: "Sin datos",
        description: "Se requieren movimientos registrados para analizar el desempeño.",
        variant: "destructive"
      })
      return
    }

    setIsCargandoIA(true)
    try {
      const resultado = await analizarPersonal({
        estadisticas: stats.dataArray.map(s => ({
          nombre: s.nombre,
          rol: s.rol,
          totalMovimientos: s.totalMovimientos,
          volumenTotal: s.volumenTotal,
          materialesDistintos: s.materialesDistintos
        }))
      })
      setAnalisisIA(resultado)
      toast({
        title: "Análisis generado",
        description: "Insights estratégicos listos para revisión.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar el análisis de rendimiento.",
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
              <TrendingUp strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Evaluación de Desempeño</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-14">Métricas de carga de trabajo y productividad real.</p>
        </div>
        <Button 
          onClick={manejarAnalisisIA} 
          disabled={isCargandoIA || loadingMov}
          className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-black shadow-lg h-12 rounded-2xl px-8"
        >
          {isCargandoIA ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles strokeWidth={1.5} className="mr-2 h-5 w-5" />}
          Generar Insights con IA
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-none bg-white shadow-sm overflow-hidden rounded-3xl">
          <CardHeader className="pb-2 px-8 pt-8">
             <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Volumen Global</CardTitle>
                <div className="p-2 rounded-xl bg-primary/5 text-primary">
                    <Box strokeWidth={1.5} className="h-5 w-5" />
                </div>
             </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-4xl font-black text-primary">
              {loadingMov ? "..." : stats.volumenTotalGlobal}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Unidades totales gestionadas</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-sm overflow-hidden rounded-3xl">
          <CardHeader className="pb-2 px-8 pt-8">
             <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Operaciones</CardTitle>
                <div className="p-2 rounded-xl bg-accent/5 text-accent">
                    <Zap strokeWidth={1.5} className="h-5 w-5" />
                </div>
             </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-4xl font-black text-accent">
              {loadingMov ? "..." : stats.totalMovimientosGlobal}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Registros de actividad</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-sm overflow-hidden rounded-3xl">
          <CardHeader className="pb-2 px-8 pt-8">
             <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Personal Activo</CardTitle>
                <div className="p-2 rounded-xl bg-muted/50 text-muted-foreground">
                    <Users strokeWidth={1.5} className="h-5 w-5" />
                </div>
             </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-4xl font-black text-muted-foreground">
              {loadingTrab ? "..." : trabajadores.length}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Colaboradores en sistema</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="bg-white border-none shadow-sm overflow-hidden rounded-3xl">
          <CardHeader className="p-8">
            <CardTitle className="flex items-center gap-2 text-primary font-black text-lg uppercase tracking-tight">
              <BarChart3 strokeWidth={1.5} className="h-6 w-6" /> Líderes de Volumen
            </CardTitle>
            <CardDescription className="text-xs md:text-sm font-medium">Top 5 colaboradores por unidades gestionadas.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[400px] p-4">
            {stats.top5.length > 0 ? (
              <ChartContainer config={{ volume: { label: "Volumen", color: "hsl(var(--primary))" } }} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.top5} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="nombre" 
                      type="category" 
                      fontSize={10} 
                      fontFamily="Inter"
                      fontWeight="bold"
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="volumenTotal" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]}>
                      {stats.top5.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <BarChart3 strokeWidth={1} className="h-24 w-24 mb-4" />
                <p className="font-black text-xs uppercase tracking-widest">Sin datos suficientes</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {analisisIA && (
            <Card className="bg-primary/5 border-none shadow-xl animate-in zoom-in-95 duration-500 overflow-hidden rounded-[2.5rem] ring-1 ring-primary/10">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-primary font-black text-xl">
                    <Sparkles strokeWidth={1.5} className="h-7 w-7 text-accent" /> Insights Estratégicos
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-8 pt-0">
                <div className="text-sm leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap bg-white/60 p-6 rounded-2xl border border-primary/5 shadow-inner">
                  {analisisIA.analisis}
                </div>
                <div className="grid gap-3">
                  {analisisIA.recomendaciones.slice(0, 2).map((rec, i) => (
                    <div key={i} className="text-xs bg-white p-4 rounded-xl border border-primary/5 shadow-sm flex items-start gap-3">
                      <div className="bg-primary text-primary-foreground h-5 w-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0">{i+1}</div>
                      <span className="font-bold text-foreground/70">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white border-none shadow-sm overflow-hidden rounded-3xl">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-2 text-primary font-black text-lg uppercase tracking-tight">
                <Users strokeWidth={1.5} className="h-6 w-6" /> Desglose por Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-primary/5">
                {stats.dataArray.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="p-6 flex items-center justify-between hover:bg-muted/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs">
                        {item.nombre.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{item.nombre}</span>
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">{item.rol}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <span className="block font-black text-sm text-primary">{item.volumenTotal}</span>
                        <span className="text-[9px] font-black uppercase text-muted-foreground">Unidades</span>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <span className="block font-black text-sm text-accent">{item.totalMovimientos}</span>
                        <span className="text-[9px] font-black uppercase text-muted-foreground">Ops.</span>
                      </div>
                    </div>
                  </div>
                ))}
                {stats.dataArray.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground opacity-30 font-black uppercase text-xs tracking-widest">
                    No hay movimientos registrados
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

