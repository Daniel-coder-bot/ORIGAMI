"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Box, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  LayoutGrid,
  Clock,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  TrendingUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer, Cell } from "recharts"
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'

const chartConfig = {
  stock: {
    label: "Movimientos",
    color: "hsl(var(--primary))",
  },
}

export default function DashboardPage() {
  const db = useFirestore()
  const [barSize, setBarSize] = useState(32)
  
  const articulosRef = useMemoFirebase(() => db ? collection(db, 'articulos') : null, [db])
  const movimientosRecientesRef = useMemoFirebase(() => 
    db ? query(collection(db, 'movimientosStock'), orderBy('fecha', 'desc'), limit(5)) : null, 
  [db])

  const { data: articulosData, loading: loadingArt } = useCollection(articulosRef)
  const { data: movimientosData, loading: loadingMov } = useCollection(movimientosRecientesRef)

  const articulos = articulosData || []
  const movimientos = movimientosData || []

  useEffect(() => {
    const updateBarSize = () => {
      setBarSize(window.innerWidth < 640 ? 16 : 32)
    }
    updateBarSize()
    window.addEventListener('resize', updateBarSize)
    return () => window.removeEventListener('resize', updateBarSize)
  }, [])

  const stats = useMemo(() => {
    const totalStock = articulos.reduce((acc, m) => acc + (Number(m.stockActual) || 0), 0)
    const stockBajo = articulos.filter(m => (Number(m.stockActual) || 0) <= (Number(m.stockMinimo) || 5))
    return {
      totalArticulos: articulos.length,
      totalStock,
      bajoStockCount: stockBajo.length,
      articulosBajoStock: stockBajo
    }
  }, [articulos])

  const chartData = [
    { mes: "Ene", stock: 400 },
    { mes: "Feb", stock: 300 },
    { mes: "Mar", stock: 200 },
    { mes: "Abr", stock: 278 },
    { mes: "May", stock: 189 },
    { mes: "Jun", stock: 239 },
  ]

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/10">
              <LayoutGrid strokeWidth={2} className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-secondary">Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground font-medium pl-14">Vista general del sistema corporativo SyncStock.</p>
        </div>
        <Button onClick={handleRefresh} className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105">
          <RefreshCcw strokeWidth={2} className="mr-2 h-4 w-4" /> Sincronizar Datos
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp className="h-4 w-4 text-secondary/60" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-secondary/60">Indicadores Clave</h2>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-none bg-white shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Artículos</CardTitle>
              <div className="p-2 rounded-xl bg-secondary/5 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                <Box strokeWidth={1.5} className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{loadingArt ? "..." : stats.totalArticulos}</div>
              <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Catálogo Activo</p>
            </CardContent>
          </Card>
          
          <Card className="border-none bg-white shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Existencias</CardTitle>
              <div className="p-2 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Activity strokeWidth={1.5} className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{loadingArt ? "..." : stats.totalStock}</div>
              <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Unidades Reales</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stock Bajo</CardTitle>
              <div className={`p-2 rounded-xl transition-colors ${stats.bajoStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <AlertTriangle strokeWidth={1.5} className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.bajoStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.bajoStockCount}
              </div>
              <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Alertas de Reposición</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-white shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Operaciones</CardTitle>
              <div className="p-2 rounded-xl bg-accent/5 text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                <Clock strokeWidth={1.5} className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{movimientos.length}</div>
              <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Últimas 24h</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none bg-white shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-xl text-secondary font-bold flex items-center gap-3">
              <TrendingUp strokeWidth={2} className="h-5 w-5 text-primary" /> Tendencias de Stock
            </CardTitle>
            <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Flujo acumulado de inventario mensual</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="mes" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    fontFamily="Poppins"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="stock" 
                    radius={[6, 6, 0, 0]} 
                    barSize={barSize}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none bg-white shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8">
            <CardTitle className="text-xl text-secondary font-bold flex items-center gap-3">
              <Clock strokeWidth={2} className="h-5 w-5 text-accent" /> Actividad Reciente
            </CardTitle>
            <CardDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Últimos movimientos sincronizados</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-6">
              {loadingMov ? (
                <div className="py-10 text-center text-muted-foreground font-bold animate-pulse">Consultando registros...</div>
              ) : movimientos.length > 0 ? movimientos.map((mov: any) => (
                <div key={mov.id} className="flex items-center text-sm group">
                  <div className={`mr-4 rounded-2xl p-3 flex-shrink-0 transition-all group-hover:scale-110 ${mov.tipo === 'entrada' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {mov.tipo === 'entrada' ? <ArrowUpRight strokeWidth={2.5} className="h-4 w-4" /> : <ArrowDownRight strokeWidth={2.5} className="h-4 w-4" />}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="font-bold leading-none truncate group-hover:text-secondary transition-colors">{mov.articuloNombre}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.05em]">
                      {mov.tipo} · {mov.cantidad} unidades
                    </p>
                  </div>
                  <div className="ml-2 font-bold text-[10px] text-muted-foreground bg-[#F5F7FA] px-3 py-1.5 rounded-lg border border-border/50">
                    {mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '---'}
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-muted-foreground font-bold uppercase text-[10px] tracking-widest italic">No hay historial disponible</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.bajoStockCount > 0 && (
        <Card className="border-none bg-white shadow-xl shadow-red-500/5 rounded-[2.5rem] overflow-hidden border-l-[6px] border-l-red-500">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-red-600 font-bold text-lg flex items-center gap-3 uppercase tracking-[0.15em]">
              <AlertTriangle className="h-5 w-5" /> Alertas Críticas de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.articulosBajoStock.map((art: any) => (
                <div key={art.id} className="bg-[#F5F7FA] p-5 rounded-[1.5rem] border border-border flex justify-between items-center group hover:bg-white hover:shadow-lg transition-all">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-secondary truncate">{art.nombre}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">Stock: {art.stockActual} {art.unidad}</p>
                  </div>
                  <Badge variant="destructive" className="font-bold text-[9px] uppercase px-3 py-1 rounded-full bg-red-600">Reposición</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}