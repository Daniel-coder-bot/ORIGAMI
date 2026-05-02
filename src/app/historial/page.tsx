
"use client"

import React, { useState, useMemo } from 'react'
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
  FileText,
  ArrowUpDown
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
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFirestore, useCollection } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import { useMemoFirebase } from '@/firebase/use-memo-firebase'

type OrderByField = 'fecha' | 'cantidad' | 'materialNombre';
type OrderDir = 'asc' | 'desc';

export default function HistorialPage() {
  const db = useFirestore()
  const [busqueda, setBusqueda] = useState('')
  const [ordenCampo, setOrdenCampo] = useState<OrderByField>('fecha')
  const [ordenDir, setOrdenDir] = useState<OrderDir>('desc')

  const movimientosQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'movements'), orderBy('fecha', 'desc'), limit(100)) : null, 
  [db])

  const { data: movimientos = [], loading } = useCollection(movimientosQuery)

  const filtrados = useMemo(() => {
    let result = movimientos.filter((h: any) => 
      h.materialNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.trabajadorNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.tipo?.toLowerCase().includes(busqueda.toLowerCase())
    );

    return result.sort((a: any, b: any) => {
      const valA = a[ordenCampo];
      const valB = b[ordenCampo];
      
      if (ordenDir === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [movimientos, busqueda, ordenCampo, ordenDir]);

  const toggleOrden = (campo: OrderByField) => {
    if (ordenCampo === campo) {
      setOrdenDir(ordenDir === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenCampo(campo);
      setOrdenDir('desc');
    }
  };

  const exportarReporte = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Fecha,Material,Tipo,Cantidad,Responsable,Notas\n"
      + filtrados.map(m => `${m.fecha},${m.materialNombre},${m.tipo},${m.cantidad},${m.trabajadorNombre},${m.notas || ''}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_movimientos_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10">
              <ClipboardList strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Historial</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-14">Registro auditor de todas las operaciones.</p>
        </div>
        <Button onClick={exportarReporte} variant="outline" className="w-full md:w-auto h-12 px-8 rounded-2xl border-primary/20 text-primary font-black hover:bg-primary/5 transition-all">
          <Download strokeWidth={1.5} className="mr-2 h-5 w-5" /> Exportar
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        <CardContent className="p-4 md:p-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-10">
            <div className="flex-1 relative">
              <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por artículo o responsable..." 
                className="pl-12 h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 font-bold"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-14 px-6 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-muted/50">
                    <ArrowUpDown strokeWidth={1.5} className="mr-2 h-4 w-4" /> Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl p-2 bg-white">
                  <DropdownMenuItem onClick={() => toggleOrden('fecha')} className="text-xs font-bold p-3 rounded-lg cursor-pointer">Fecha {ordenCampo === 'fecha' && (ordenDir === 'asc' ? '↑' : '↓')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleOrden('materialNombre')} className="text-xs font-bold p-3 rounded-lg cursor-pointer">Material {ordenCampo === 'materialNombre' && (ordenDir === 'asc' ? '↑' : '↓')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleOrden('cantidad')} className="text-xs font-bold p-3 rounded-lg cursor-pointer">Cantidad {ordenCampo === 'cantidad' && (ordenDir === 'asc' ? '↑' : '↓')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-muted/50 overflow-hidden bg-white shadow-inner">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground py-6 px-8">Fecha</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Material</TableHead>
                    <TableHead className="font-black text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Operación</TableHead>
                    <TableHead className="font-black text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cantidad</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Responsable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="h-60 text-center font-black text-muted-foreground animate-pulse tracking-widest uppercase text-xs">Sincronizando...</TableCell></TableRow>
                  ) : filtrados.map((mov: any) => (
                    <TableRow key={mov.id} className="hover:bg-primary/5 transition-colors border-muted/20">
                      <TableCell className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-muted/50 text-muted-foreground shadow-inner">
                            <Clock strokeWidth={1.5} className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-primary">
                              {new Date(mov.fecha).toLocaleDateString('es-ES')}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-black uppercase">
                              {new Date(mov.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-sm text-foreground">{mov.materialNombre}</span>
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
                        <span className="font-bold text-xs text-foreground bg-muted/30 px-3 py-1.5 rounded-xl">{mov.trabajadorNombre}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && filtrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-60 text-center text-muted-foreground font-black opacity-30 uppercase text-[10px] tracking-widest">
                        No se encontraron resultados
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
