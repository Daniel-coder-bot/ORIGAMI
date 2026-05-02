
"use client"

import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Download, 
  ClipboardList,
  Clock,
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'

type OrderByField = 'fecha' | 'cantidad' | 'articuloNombre';
type OrderDir = 'asc' | 'desc';

export default function HistorialPage() {
  const db = useFirestore()
  const [busqueda, setBusqueda] = useState('')
  const [ordenCampo, setOrdenCampo] = useState<OrderByField>('fecha')
  const [ordenDir, setOrdenDir] = useState<OrderDir>('desc')

  const movimientosQuery = useMemoFirebase(() => 
    db ? query(collection(db, 'movimientosStock'), orderBy('fecha', 'desc'), limit(100)) : null, 
  [db])

  const { data: movimientosData, loading } = useCollection(movimientosQuery)
  const movimientos = movimientosData || []

  const filtrados = useMemo(() => {
    let result = movimientos.filter((h: any) => 
      h.articuloNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.trabajadorNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.tipo?.toLowerCase().includes(busqueda.toLowerCase())
    );

    return result.sort((a: any, b: any) => {
      const valA = a[ordenCampo] || '';
      const valB = b[ordenCampo] || '';
      if (ordenDir === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
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
      + "Fecha,Artículo,Tipo,Cantidad,Responsable\n"
      + filtrados.map(m => `${m.fecha},${m.articuloNombre},${m.tipo},${m.cantidad},${m.trabajadorNombre}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_inventario.csv`);
    link.click();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10">
              <ClipboardList strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Historial de Movimientos</h1>
          </div>
        </div>
        <Button onClick={exportarReporte} variant="outline" className="h-12 px-8 rounded-2xl font-black">
          <Download className="mr-2 h-5 w-5" /> Exportar
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
        <CardContent className="p-4 md:p-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-10">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por artículo o responsable..." 
                className="pl-12 h-14 rounded-2xl bg-muted/30 border-none font-bold"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-14 px-6 font-black uppercase tracking-widest rounded-2xl">
                  <ArrowUpDown className="mr-2 h-4 w-4" /> Ordenar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl p-2 bg-white">
                <DropdownMenuItem onClick={() => toggleOrden('fecha')}>Fecha</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleOrden('articuloNombre')}>Artículo</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleOrden('cantidad')}>Cantidad</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="rounded-[1.5rem] border border-muted/50 overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-black py-6 px-8">Fecha</TableHead>
                  <TableHead className="font-black">Artículo</TableHead>
                  <TableHead className="font-black text-center">Tipo</TableHead>
                  <TableHead className="font-black text-center">Cantidad</TableHead>
                  <TableHead className="font-black">Responsable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="h-40 text-center animate-pulse">Cargando historial...</TableCell></TableRow>
                ) : filtrados.map((mov: any) => (
                  <TableRow key={mov.id} className="hover:bg-primary/5 border-muted/20">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-black text-sm">{mov.fecha ? new Date(mov.fecha).toLocaleDateString() : '---'}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-black text-sm">{mov.articuloNombre}</span></TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={mov.tipo === 'entrada' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}>
                        {mov.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-black">{mov.cantidad}</TableCell>
                    <TableCell><span className="font-bold text-xs">{mov.trabajadorNombre}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
