
"use client"

import React, { useState } from 'react'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Download, 
  Calendar,
  Filter,
  ClipboardList,
  Clock,
  UserRound,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/badge"
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { useMemoFirebase } from '@/firebase/use-memo-firebase'

export default function HistorialPage() {
  const db = useFirestore()
  const [busqueda, setBusqueda] = useState('')

  const movimientosQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'movimientos'), orderBy('fecha', 'desc')) : null, 
  [db])

  const { data: movimientos = [], loading } = useCollection(movimientosQuery)

  const filtrados = movimientos.filter((h: any) => 
    h.materialNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    h.trabajadorNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    h.tipo?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const exportarReporte = () => {
    alert("Generando reporte CSV con " + filtrados.length + " registros...")
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10">
              <ClipboardList strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Historial Maestro</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-14">Registro auditor de todas las operaciones de inventario.</p>
        </div>
        <Button onClick={exportarReporte} variant="outline" className="w-full md:w-auto h-12 px-8 rounded-2xl border-primary/20 text-primary font-black hover:bg-primary/5 transition-all">
          <Download strokeWidth={1.5} className="mr-2 h-5 w-5" /> Exportar Datos
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        <CardContent className="p-4 md:p-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-10">
            <div className="flex-1 relative">
              <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por artículo, responsable o tipo..." 
                className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 font-bold"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="ghost" className="h-14 px-6 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-muted/50">
                <Calendar strokeWidth={1.5} className="mr-2 h-4 w-4" /> Periodo
              </Button>
              <Button variant="ghost" className="h-14 px-6 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-muted/50">
                <Filter strokeWidth={1.5} className="mr-2 h-4 w-4" /> Filtros
              </Button>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-muted/50 overflow-hidden bg-white shadow-inner">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground py-6 px-8">Marca Temporal</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Material / SKU</TableHead>
                    <TableHead className="font-black text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Operación</TableHead>
                    <TableHead className="font-black text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Volumen</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Responsable</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden md:table-cell text-right pr-8">Auditoría</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-60 text-center font-black text-muted-foreground animate-pulse tracking-widest uppercase text-xs">Sincronizando registros...</TableCell></TableRow>
                  ) : filtrados.map((mov: any) => (
                    <TableRow key={mov.id} className="hover:bg-primary/5 transition-colors border-muted/20">
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-muted/50 text-muted-foreground shadow-inner">
                            <Clock strokeWidth={1.5} className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-primary">
                              {new Date(mov.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">
                              {new Date(mov.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-sm text-foreground">{mov.materialNombre}</span>
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">ID: {mov.materialId?.slice(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={`font-black uppercase px-4 py-1.5 text-[9px] rounded-full border-none shadow-sm ${mov.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {mov.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-black text-base text-primary">{mov.cantidad}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserRound strokeWidth={1.5} className="h-3 w-3 text-muted-foreground" />
                          <span className="font-bold text-xs text-foreground bg-muted/30 px-3 py-1.5 rounded-xl">{mov.trabajadorNombre || 'Anónimo'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8 hidden md:table-cell">
                        <div className="flex items-center justify-end gap-2 text-muted-foreground/40 italic">
                          <FileText strokeWidth={1.5} className="h-4 w-4" />
                          <span className="text-[10px] font-medium max-w-[120px] truncate">{mov.notas || "Sin notas"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && filtrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-60 text-center text-muted-foreground font-black">
                        <div className="flex flex-col items-center gap-4 opacity-20">
                          <ClipboardList strokeWidth={1} className="h-20 w-20" />
                          <span className="uppercase tracking-[0.2em] text-xs">No se encontraron movimientos</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
