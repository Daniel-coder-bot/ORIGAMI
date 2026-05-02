
"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { ArrowUpRight, ArrowDownRight, History, CheckCircle2, User, Search, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/auth-context'
import { cn } from '@/lib/utils'

export default function MovimientosPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const { user } = useAuth()
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  
  const [busquedaArticulo, setBusquedaArticulo] = useState('')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const [datos, setDatos] = useState({
    articuloId: '',
    trabajadorId: '',
    cantidad: '',
    notas: ''
  })
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isProcesando, setIsProcesando] = useState(false)

  // Autocompletar datos del trabajador si hay una sesión activa
  useEffect(() => {
    if (user && user.role === 'Trabajador') {
      setDatos(prev => ({ ...prev, trabajadorId: user.id }))
    }
  }, [user])

  const articulosRef = useMemoFirebase(() => db ? collection(db, 'articulos') : null, [db])
  const trabajadoresRef = useMemoFirebase(() => db ? collection(db, 'trabajadores') : null, [db])
  
  const { data: articulosData } = useCollection(articulosRef)
  const { data: trabajadoresData } = useCollection(trabajadoresRef)

  const articulos = useMemo(() => articulosData || [], [articulosData])
  const trabajadores = useMemo(() => trabajadoresData || [], [trabajadoresData])

  // Filtrado dinámico de artículos
  const articulosFiltrados = useMemo(() => {
    if (!busquedaArticulo.trim()) return articulos;
    const term = busquedaArticulo.toLowerCase();
    return articulos.filter((a: any) => 
      a.nombre?.toLowerCase().includes(term) || 
      a.codigo?.toLowerCase().includes(term)
    );
  }, [articulos, busquedaArticulo]);

  const articuloSeleccionado = useMemo(() => {
    return articulos.find((m: any) => m.id === datos.articuloId) || null
  }, [articulos, datos.articuloId])

  const trabajadorSeleccionado = useMemo(() => {
    const idABuscar = user?.role === 'Trabajador' ? user.id : datos.trabajadorId
    if (!trabajadores || !idABuscar) return null
    return trabajadores.find((t: any) => t.id === idABuscar) || null
  }, [trabajadores, datos.trabajadorId, user])

  const manejarValidacion = (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalTrabajadorId = user?.role === 'Trabajador' ? user.id : datos.trabajadorId

    if (!datos.articuloId || !finalTrabajadorId || !datos.cantidad) {
      toast({ 
        title: "Datos incompletos", 
        description: "Por favor selecciona un artículo, un responsable y una cantidad válida.",
        variant: "destructive" 
      })
      return
    }

    const cantidadNum = Number(datos.cantidad)
    if (cantidadNum <= 0) {
      toast({ title: "Cantidad inválida", description: "La cantidad debe ser mayor a 0.", variant: "destructive" })
      return
    }

    if (tipo === 'salida' && (Number(articuloSeleccionado?.stockActual) || 0) < cantidadNum) {
      toast({ title: "Stock insuficiente", description: `Solo hay ${articuloSeleccionado?.stockActual} disponibles.`, variant: "destructive" })
      return
    }

    setIsConfirmOpen(true)
  }

  const confirmarMovimiento = async () => {
    if (!db || !articuloSeleccionado) return
    
    const tNombre = trabajadorSeleccionado?.nombre || user?.nombre
    const tId = user?.role === 'Trabajador' ? user.id : datos.trabajadorId

    if (!tId || !tNombre) {
      toast({ title: "Error de responsable", description: "No se pudo identificar al responsable de la operación.", variant: "destructive" })
      return
    }

    setIsProcesando(true)
    const cantidadNum = Number(datos.cantidad)
    const articuloDocRef = doc(db, 'articulos', datos.articuloId)
    const nuevoStock = tipo === 'entrada' 
      ? (Number(articuloSeleccionado.stockActual) || 0) + cantidadNum
      : (Number(articuloSeleccionado.stockActual) || 0) - cantidadNum

    const movData = {
      articuloId: datos.articuloId,
      articuloNombre: articuloSeleccionado.nombre,
      trabajadorId: tId,
      trabajadorNombre: tNombre,
      tipo,
      cantidad: cantidadNum,
      fecha: new Date().toISOString(),
      notas: datos.notas,
      createdAt: serverTimestamp()
    }

    try {
      await addDoc(collection(db, 'movimientosStock'), movData);
      await updateDoc(articuloDocRef, {
        stockActual: nuevoStock,
        updatedAt: serverTimestamp()
      });
      
      toast({ title: "Movimiento registrado", description: "El stock ha sido actualizado correctamente." });
      
      setDatos({ 
        articuloId: '', 
        trabajadorId: user?.role === 'Trabajador' ? user.id : '', 
        cantidad: '', 
        notas: '' 
      });
      
      setIsProcesando(false);
      setIsConfirmOpen(false);
      
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setIsProcesando(false);
      toast({ title: "Error al guardar", description: "Hubo un problema de conexión con el servidor.", variant: "destructive" });
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10">
            <History strokeWidth={1.5} className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Operaciones de Inventario</h1>
        </div>
        <p className="text-xs font-bold text-muted-foreground pl-14">Registro oficial de entradas y salidas de almacén.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all border-none rounded-[2rem] ${tipo === 'entrada' ? 'ring-2 ring-primary bg-primary/5 shadow-lg scale-[1.02]' : 'bg-white hover:bg-muted/5'}`} 
          onClick={() => setTipo('entrada')}
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className={`p-5 rounded-2xl mx-auto w-fit ${tipo === 'entrada' ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground'}`}>
              <ArrowUpRight className="h-8 w-8" />
            </div>
            <h3 className="font-black text-xl text-primary uppercase tracking-tight">Carga de Stock</h3>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border-none rounded-[2rem] ${tipo === 'salida' ? 'ring-2 ring-accent bg-accent/5 shadow-lg scale-[1.02]' : 'bg-white hover:bg-muted/5'}`} 
          onClick={() => setTipo('salida')}
        >
          <CardContent className="p-8 text-center space-y-4">
            <div className={`p-5 rounded-2xl mx-auto w-fit ${tipo === 'salida' ? 'bg-accent text-white' : 'bg-muted/50 text-muted-foreground'}`}>
              <ArrowDownRight className="h-8 w-8" />
            </div>
            <h3 className="font-black text-xl text-accent uppercase tracking-tight">Salida de Material</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[2.5rem]">
        <CardContent className="p-8 md:p-12">
          <form onSubmit={manejarValidacion} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                {/* Selector Dinámico de Artículo */}
                <div className="space-y-3">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Material / Artículo</Label>
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full h-14 justify-between rounded-2xl font-bold px-4",
                          !datos.articuloId && "text-muted-foreground"
                        )}
                      >
                        {articuloSeleccionado 
                          ? `${articuloSeleccionado.nombre} (${articuloSeleccionado.stockActual} ${articuloSeleccionado.unidad?.slice(0,3)})`
                          : "Buscar producto..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl overflow-hidden border-none shadow-2xl">
                      <div className="flex items-center border-b px-3 bg-muted/20">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                          placeholder="Escribe el nombre o código..."
                          className="h-12 border-none bg-transparent focus-visible:ring-0 font-bold"
                          value={busquedaArticulo}
                          onChange={(e) => setBusquedaArticulo(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                        {articulosFiltrados.length === 0 ? (
                          <div className="py-6 text-center text-xs font-black text-muted-foreground uppercase tracking-widest">
                            No se encontraron artículos
                          </div>
                        ) : (
                          articulosFiltrados.map((a: any) => (
                            <div
                              key={a.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors",
                                datos.articuloId === a.id ? "bg-primary text-white" : "hover:bg-primary/10"
                              )}
                              onClick={() => {
                                setDatos({ ...datos, articuloId: a.id });
                                setIsPopoverOpen(false);
                                setBusquedaArticulo('');
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold text-sm">{a.nombre}</span>
                                <span className={cn("text-[10px] font-black uppercase tracking-tighter", datos.articuloId === a.id ? "text-white/80" : "text-muted-foreground")}>
                                  {a.codigo}
                                </span>
                              </div>
                              <span className="font-black text-xs">
                                {a.stockActual} {a.unidad?.slice(0,3)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Responsable</Label>
                  {user?.role === 'Trabajador' ? (
                    <div className="flex items-center gap-3 h-14 w-full rounded-2xl bg-muted/30 px-4 border border-transparent">
                      <User className="h-5 w-5 text-primary" />
                      <span className="font-bold text-sm text-foreground">{user.nombre}</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input 
                        placeholder="ID o Nombre del responsable..." 
                        className="h-14 rounded-2xl font-bold"
                        value={trabajadorSeleccionado?.nombre || ""}
                        readOnly
                        onClick={() => {/* Podría añadirse búsqueda dinámica también aquí */}}
                      />
                      <select 
                        className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                        value={datos.trabajadorId} 
                        onChange={(e) => setDatos({...datos, trabajadorId: e.target.value})}
                      >
                        <option value="">Seleccionar responsable...</option>
                        {(trabajadores || []).map((t: any) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {user?.role === 'Trabajador' && <p className="text-[10px] font-bold text-primary/60 italic px-1">Tu usuario ha sido asignado automáticamente.</p>}
                </div>

                <div className="space-y-3">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Cantidad a Procesar</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="h-16 text-3xl font-black rounded-2xl pl-8" 
                      value={datos.cantidad} 
                      onChange={(e) => setDatos({...datos, cantidad: e.target.value})} 
                    />
                    {articuloSeleccionado && <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-muted-foreground uppercase text-xs">{articuloSeleccionado.unidad}</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Observaciones Técnicas</Label>
                <Textarea 
                  placeholder="Indica el motivo, destino o detalles relevantes..." 
                  className="min-h-[220px] rounded-2xl font-bold p-6 resize-none bg-muted/5 border-none focus:bg-white transition-colors" 
                  value={datos.notas} 
                  onChange={(e) => setDatos({...datos, notas: e.target.value})} 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-primary/5 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Sincronización en tiempo real activa</span>
               </div>
               <Button 
                type="submit" 
                size="lg" 
                className={`w-full md:w-auto px-16 font-black h-16 rounded-[1.5rem] shadow-xl transition-transform active:scale-95 ${tipo === 'entrada' ? 'bg-primary' : 'bg-accent'}`}
               >
                <CheckCircle2 className="mr-3 h-6 w-6" /> Confirmar Operación
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10">
          <AlertDialogHeader className="space-y-4">
            <AlertDialogTitle className="text-center text-2xl font-black text-primary uppercase tracking-tight italic">
              ¿Confirmar Registro?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center font-bold text-muted-foreground text-lg leading-relaxed">
              Vas a registrar una <span className={tipo === 'entrada' ? 'text-primary' : 'text-accent'}>{tipo.toUpperCase()}</span> de <span className="text-foreground">{datos.cantidad}</span> {articuloSeleccionado?.nombre || 'unidades'}.
              <br/>
              <span className="text-xs font-black uppercase block mt-4 opacity-50 tracking-widest">Esta acción actualizará el stock inmediatamente</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-4 mt-10">
            <AlertDialogCancel disabled={isProcesando} className="h-14 rounded-2xl font-black uppercase tracking-widest px-8">Revisar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); confirmarMovimiento(); }} 
              disabled={isProcesando} 
              className={`h-14 rounded-2xl font-black uppercase tracking-widest px-10 ${tipo === 'entrada' ? 'bg-primary' : 'bg-accent'}`}
            >
              {isProcesando ? <CustomLoader className="animate-spin h-5 w-5" /> : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const CustomLoader = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
)
