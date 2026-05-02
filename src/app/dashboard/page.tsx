"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { 
  UserRound, 
  Box, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  LayoutGrid,
  Clock,
  AlertTriangle,
  RefreshCcw
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import { useMemoFirebase } from '@/firebase/use-memo-firebase'

const chartConfig = {
  stock: {
    label: "Movimientos",
    color: "hsl(var(--primary))",
  },
}

export default function DashboardPage() {
  const db = useFirestore()
  const [barSize, setBarSize] = useState(32)
  
  const materialesRef = useMemoFirebase(() => db ? collection(db, 'materiales') : null, [db])
  const movimientosRecientesRef = useMemoFirebase(() => 
    db ? query(collection(db, 'movimientos'), orderBy('fecha', 'desc'), limit(5)) : null, 
  [db])

  const { data: materiales = [], loading: loadingMat } = useCollection(materialesRef)
  const { data: movimientos = [], loading: loadingMov } = useCollection(movimientosRecientesRef)

  useEffect(() => {
    const updateBarSize = () => {
      setBarSize(window.innerWidth < 640 ? 16 : 32)
    }
    updateBarSize()
    window.addEventListener('resize', updateBarSize)
    return () => window.removeEventListener('resize', updateBarSize)
  }, [])

  const stats = useMemo(() => {
    const totalStock = materiales.reduce((acc, m) => acc + (m.stockActual || 0), 0)
    const stockBajo = materiales.filter(m => (m.stockActual || 0) <= (m.stockMinimo || 5))
    return {
      totalArticulos: materiales.length,
      totalStock,
      bajoStockCount: stockBajo.length,
      articulosBajoStock: stockBajo
    }
  }, [materiales])

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
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <LayoutGrid strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Panel de Control</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-12">Monitoreo en tiempo real del inventario y operaciones.</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="w-full md:w-auto border-primary/20 hover:bg-primary/5 font-bold h-11 px-6 rounded-xl">
          <RefreshCcw strokeWidth={1.5} className="mr-2 h-4 w-4" /> Actualizar Datos
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Artículos Totales</CardTitle>
            <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
              <Box strokeWidth={1.5} className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-black">{loadingMat ? "..." : stats.totalArticulos}</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Catálogo en sistema</p>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Existencias</CardTitle>
            <div className="p-1.5 rounded-lg bg-accent/5 text-accent">
              <Activity strokeWidth={1.5} className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-black">{loadingMat ? "..." : stats.totalStock}</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Unidades totales</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alertas Stock</CardTitle>
            <div className={`p-1.5 rounded-lg ${stats.bajoStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              <AlertTriangle strokeWidth={1.5} className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl md:text-3xl font-black ${stats.bajoStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.bajoStockCount}
            </div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Reponer pronto</p>
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Movimientos Hoy</CardTitle>
            <div className="p-1.5 rounded-lg bg-primary/5 text-primary">
              <Clock strokeWidth={1.5} className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-black">{movimientos.length}</div>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Últimos registros</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none bg-white shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-primary font-bold flex items-center gap-2">
              <Activity strokeWidth={1.5} className="h-5 w-5" /> Análisis de Stock
            </CardTitle>
            <CardDescription className="text-xs md:text-sm font-medium">Histórico acumulado de operaciones.</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="mes" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="stock" 
                    fill="var(--color-stock)" 
                    radius={[4, 4, 0, 0]} 
                    barSize={barSize}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-primary font-bold flex items-center gap-2">
              <Clock strokeWidth={1.5} className="h-5 w-5" /> Actividad Reciente
            </CardTitle>
            <CardDescription className="text-xs md:text-sm font-medium">Últimas operaciones registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 md:space-y-6">
              {loadingMov ? (
                <div className="py-10 text-center text-muted-foreground font-bold animate-pulse">Cargando movimientos...</div>
              ) : movimientos.length > 0 ? movimientos.map((mov: any) => (
                <div key={mov.id} className="flex items-center text-sm group">
                  <div className={`mr-3 md:mr-4 rounded-xl p-2.5 flex-shrink-0 transition-colors ${mov.tipo === 'entrada' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {mov.tipo === 'entrada' ? <ArrowUpRight strokeWidth={2} className="h-4 w-4" /> : <ArrowDownRight strokeWidth={2} className="h-4 w-4" />}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="font-bold leading-none truncate group-hover:text-primary transition-colors">{mov.materialNombre}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                      {mov.tipo} • {mov.cantidad} unid.
                    </p>
                  </div>
                  <div className="ml-2 font-bold text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded-md">
                    {new Date(mov.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center text-muted-foreground font-bold">No hay movimientos registrados.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.bajoStockCount > 0 && (
        <Card className="border-none bg-red-50 shadow-sm overflow-hidden ring-1 ring-red-100">
          <CardHeader className="pb-3 px-6 pt-6">
            <CardTitle className="text-red-700 font-black text-sm flex items-center gap-2 uppercase tracking-widest">
              <AlertTriangle className="h-4 w-4" /> Alertas de Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.articulosBajoStock.map((art: any) => (
                <div key={art.id} className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-foreground">{art.nombre}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Actual: {art.stockActual} {art.unidad}</p>
                  </div>
                  <Badge variant="destructive" className="font-black text-[9px] uppercase px-2 py-0.5">Crítico</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
