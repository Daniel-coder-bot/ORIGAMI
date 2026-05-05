"use client"

import React, { useMemo } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Box, 
  Users,
  Zap,
  Activity,
  BarChart,
  ClipboardList,
  Target,
  Award
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid } from "recharts"
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'

const COLORS = [
  '#0B3C6D', // Azul principal
  '#2ECC71', // Verde principal
  '#1F5A8C', // Azul secundario
  '#27AE60', // Verde secundario
  '#34495E'  // Gris azulado
];

export default function AnalisisPersonalPage() {
  const db = useFirestore()

  const trabajadoresRef = useMemoFirebase(() => db ? collection(db, 'trabajadores') : null, [db])
  const movimientosRef = useMemoFirebase(() => db ? collection(db, 'movimientosStock') : null, [db])

  const { data: trabajadoresData, loading: loadingTrab } = useCollection(trabajadoresRef)
  const { data: movimientosData, loading: loadingMov } = useCollection(movimientosRef)

  const trabajadores = trabajadoresData || []
  const movimientos = movimientosData || []

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
        if (m.articuloId) statsMap[m.trabajadorId].materiales.add(m.articuloId)
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-secondary text-white shadow-xl shadow-secondary/10">
              <Target strokeWidth={2} className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Rendimiento Operativo</h1>
          </div>
          <p className="text-sm font-medium text-muted-foreground pl-14">Análisis estratégico de productividad por colaborador.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Activity className="h-4 w-4 text-primary" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/60">Indicadores de Desempeño</h2>
        </div>
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
          <Card className="border-none bg-white shadow-sm overflow-hidden rounded-[2rem] group hover:shadow-lg transition-all">
            <CardHeader className="pb-2 px-8 pt-8">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Volumen Total</CardTitle>
                  <div className="p-2.5 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Box strokeWidth={2} className="h-5 w-5" />
                  </div>
               </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="text-4xl font-bold text-secondary">
                {loadingMov ? "..." : stats.volumenTotalGlobal}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-tight">Unidades gestionadas</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm overflow-hidden rounded-[2rem] group hover:shadow-lg transition-all">
            <CardHeader className="pb-2 px-8 pt-8">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Operaciones</CardTitle>
                  <div className="p-2.5 rounded-xl bg-accent/5 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                      <Zap strokeWidth={2} className="h-5 w-5" />
                  </div>
               </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="text-4xl font-bold text-accent">
                {loadingMov ? "..." : stats.totalMovimientosGlobal}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-tight">Registros realizados</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm overflow-hidden rounded-[2rem] group hover:shadow-lg transition-all">
            <CardHeader className="pb-2 px-8 pt-8">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Personal</CardTitle>
                  <div className="p-2.5 rounded-xl bg-secondary/5 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                      <Users strokeWidth={2} className="h-5 w-5" />
                  </div>
               </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="text-4xl font-bold text-secondary">
                {loadingTrab ? "..." : trabajadores.length}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2 tracking-tight">Miembros del equipo</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/60">Estadísticas Comparativas</h2>
          </div>
          <Card className="bg-white border-none shadow-sm overflow-hidden rounded-[2rem] h-full">
            <CardHeader className="p-8">
              <CardTitle className="flex items-center gap-3 text-secondary font-bold text-xl">
                <Award strokeWidth={2} className="h-6 w-6 text-primary" /> Líderes de Volumen
              </CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Top 5 colaboradores por unidades gestionadas</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] p-6">
              {stats.top5.length > 0 ? (
                <ChartContainer config={{ volume: { label: "Volumen", color: "hsl(var(--primary))" } }} className="h-full w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={stats.top5} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.1} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="nombre" 
                        type="category" 
                        fontSize={10} 
                        fontFamily="Poppins"
                        fontWeight="600"
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="volumenTotal" radius={[0, 10, 10, 0]} barSize={30}>
                        {stats.top5.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <BarChart3 strokeWidth={1} className="h-24 w-24 mb-4" />
                  <p className="font-bold text-[10px] uppercase tracking-[0.3em]">Sin datos disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ClipboardList className="h-4 w-4 text-accent" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/60">Desglose Corporativo</h2>
          </div>
          <Card className="bg-white border-none shadow-sm overflow-hidden rounded-[2rem]">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="flex items-center gap-3 text-secondary font-bold text-xl">
                <Users strokeWidth={2} className="h-6 w-6 text-accent" /> Análisis Detallado
              </CardTitle>
              <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Métricas individuales de productividad</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border saas-table">
                {stats.dataArray.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="p-6 flex items-center justify-between group transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-secondary text-white flex items-center justify-center font-bold text-sm shadow-md shadow-secondary/10 group-hover:scale-110 transition-transform">
                        {item.nombre ? item.nombre.charAt(0) : '?'}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-secondary">{item.nombre}</span>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">{item.rol}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <span className="block font-bold text-base text-primary">{item.volumenTotal}</span>
                        <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Unidades</span>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <span className="block font-bold text-base text-accent">{item.totalMovimientos}</span>
                        <span className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Operaciones</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(loadingTrab || loadingMov) && <div className="p-12 text-center animate-pulse text-muted-foreground font-semibold">Procesando reportes...</div>}
                {!loadingTrab && !loadingMov && stats.dataArray.length === 0 && (
                  <div className="p-16 text-center text-muted-foreground opacity-30 font-bold uppercase text-[10px] tracking-widest">
                    No se han registrado movimientos
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