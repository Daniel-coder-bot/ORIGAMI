
"use client"

import React, { useState } from 'react'
import { ArrowUpRight, ArrowDownRight, UserRound, Box, History, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useFirestore, useCollection } from '@/firebase'
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

export default function MovimientosPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  const [datos, setDatos] = useState({
    articuloId: '',
    trabajadorId: '',
    cantidad: '',
    notas: ''
  })
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isProcesando, setIsProcesando] = useState(false)

  const materialesRef = db ? collection(db, 'materiales') : null
  const trabajadoresRef = db ? collection(db, 'trabajadores') : null
  
  const { data: materiales = [] } = useCollection(materialesRef)
  const { data: trabajadores = [] } = useCollection(trabajadoresRef)

  const materialSeleccionado = materiales.find((m: any) => m.id === datos.articuloId)
  const trabajadorSeleccionado = trabajadores.find((t: any) => t.id === datos.trabajadorId)

  const manejarValidacion = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!datos.articuloId || !datos.trabajadorId || !datos.cantidad) {
      toast({
        title: "Datos incompletos",
        description: "Asegúrate de seleccionar el material, el responsable y la cantidad.",
        variant: "destructive"
      })
      return
    }

    const cantidadNum = Number(datos.cantidad)
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser un número mayor a cero.",
        variant: "destructive"
      })
      return
    }

    if (tipo === 'salida' && (materialSeleccionado?.stockActual || 0) < cantidadNum) {
      toast({
        title: "Stock insuficiente",
        description: `No hay suficientes existencias de ${materialSeleccionado?.nombre}. Stock actual: ${materialSeleccionado?.stockActual}`,
        variant: "destructive"
      })
      return
    }

    setIsConfirmOpen(true)
  }

  const confirmarMovimiento = async () => {
    if (!db || !materialSeleccionado || !trabajadorSeleccionado) return

    setIsProcesando(true)
    const cantidadNum = Number(datos.cantidad)
    const materialDocRef = doc(db, 'materiales', datos.articuloId)
    const nuevoStock = tipo === 'entrada' 
      ? (materialSeleccionado.stockActual || 0) + cantidadNum
      : (materialSeleccionado.stockActual || 0) - cantidadNum

    try {
      // 1. Registrar movimiento con trazabilidad de responsable
      const movData = {
        materialId: datos.articuloId,
        materialNombre: materialSeleccionado.nombre,
        trabajadorId: datos.trabajadorId,
        trabajadorNombre: trabajadorSeleccionado.nombre,
        tipo,
        cantidad: cantidadNum,
        fecha: new Date().toISOString(),
        notas: datos.notas,
        createdAt: serverTimestamp()
      }

      await addDoc(collection(db, 'movimientos'), movData)
      
      // 2. Actualizar stock del material
      await updateDoc(materialDocRef, {
        stockActual: nuevoStock,
        updatedAt: serverTimestamp()
      })

      toast({
        title: "Movimiento exitoso",
        description: `Se ha registrado la ${tipo} de ${cantidadNum} ${materialSeleccionado.unidad}.`,
      })
      
      setDatos({ articuloId: '', trabajadorId: '', cantidad: '', notas: '' })
    } catch (err: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: `movimientos`, 
        operation: 'write',
        requestResourceData: { nuevoStock }
      }))
    } finally {
      setIsProcesando(false)
      setIsConfirmOpen(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10">
            <History strokeWidth={1.5} className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Operaciones de Stock</h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground font-medium pl-14">Registra entradas y salidas con trazabilidad completa.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all border-none rounded-[2rem] overflow-hidden ${tipo === 'entrada' ? 'ring-2 ring-primary bg-primary/5 shadow-lg' : 'bg-white hover:bg-muted/10'}`}
          onClick={() => setTipo('entrada')}
        >
          <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
            <div className={`p-5 rounded-2xl ${tipo === 'entrada' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-muted/50 text-muted-foreground'}`}>
              <ArrowUpRight strokeWidth={2} className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-xl text-primary">Entrada de Mercancía</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-2">Abastecimiento / Devolución</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border-none rounded-[2rem] overflow-hidden ${tipo === 'salida' ? 'ring-2 ring-accent bg-accent/5 shadow-lg' : 'bg-white hover:bg-muted/10'}`}
          onClick={() => setTipo('salida')}
        >
          <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
            <div className={`p-5 rounded-2xl ${tipo === 'salida' ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'bg-muted/50 text-muted-foreground'}`}>
              <ArrowDownRight strokeWidth={2} className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-xl text-accent">Salida de Almacén</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-2">Despacho / Consumo Interno</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden bg-white rounded-[2.5rem]">
        <CardHeader className={`${tipo === 'entrada' ? 'bg-primary/5' : 'bg-accent/5'} border-b border-primary/5 p-8 md:p-10`}>
           <div className="flex items-center justify-between">
             <div className="space-y-1">
               <CardTitle className="text-2xl font-black uppercase tracking-tight text-primary flex items-center gap-3">
                  {tipo === 'entrada' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6 text-accent" />}
                  {tipo === 'entrada' ? 'Formulario de Ingreso' : 'Formulario de Egreso'}
               </CardTitle>
               <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Persistencia en tiempo real</CardDescription>
             </div>
             {tipo === 'salida' && materialSeleccionado && (
               <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-2xl border border-accent/10 shadow-sm">
                 <span className="text-[9px] font-black uppercase text-muted-foreground block">Stock Disponible</span>
                 <span className="text-lg font-black text-accent">{materialSeleccionado.stockActual} {materialSeleccionado.unidad}</span>
               </div>
             )}
           </div>
        </CardHeader>
        <CardContent className="p-8 md:p-12">
          <form onSubmit={manejarValidacion} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Box strokeWidth={1.5} className="h-4 w-4" /> Material
                  </Label>
                  <Select 
                    value={datos.articuloId} 
                    onValueChange={(val) => setDatos({...datos, articuloId: val})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl font-bold border-muted/50 focus:ring-primary/20">
                      <SelectValue placeholder="Busca un material en el catálogo..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {materiales.map((a: any) => (
                        <SelectItem key={a.id} value={a.id} className="py-4 font-bold">
                          {a.nombre} <span className="text-[10px] text-muted-foreground ml-2 opacity-60">[{a.codigo || 'S/C'}]</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <UserRound strokeWidth={1.5} className="h-4 w-4" /> Responsable
                  </Label>
                  <Select 
                    value={datos.trabajadorId} 
                    onValueChange={(val) => setDatos({...datos, trabajadorId: val})}
                  >
                    <SelectTrigger className="h-14 rounded-2xl font-bold border-muted/50 focus:ring-primary/20">
                      <SelectValue placeholder="¿Quién realiza la operación?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {trabajadores.map((t: any) => (
                        <SelectItem key={t.id} value={t.id} className="py-4 font-bold">
                          {t.nombre} <span className="text-[10px] text-muted-foreground ml-2 opacity-60">({t.rol})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Volumen de Carga</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0" 
                      className="h-14 text-2xl font-black rounded-2xl border-muted/50 pl-6 focus:ring-primary/20"
                      value={datos.cantidad}
                      onChange={(e) => setDatos({...datos, cantidad: e.target.value})}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-lg">
                      {materialSeleccionado?.unidad || 'unid.'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <History strokeWidth={1.5} className="h-4 w-4" /> Notas de Seguimiento
                </Label>
                <Textarea 
                  placeholder="Justificación o detalles técnicos adicionales..." 
                  className="min-h-[280px] rounded-2xl font-bold p-6 resize-none border-muted/50 focus:ring-primary/20"
                  value={datos.notas}
                  onChange={(e) => setDatos({...datos, notas: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-10 border-t border-primary/5 flex justify-end">
              <Button type="submit" size="lg" className={`w-full md:w-auto px-16 font-black h-16 rounded-[1.5rem] shadow-2xl transition-all hover:-translate-y-1 ${tipo === 'entrada' ? 'bg-primary hover:bg-primary/90' : 'bg-accent hover:bg-accent/90'}`}>
                <CheckCircle2 strokeWidth={2.5} className="mr-3 h-6 w-6" /> Confirmar Operación
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-md">
          <AlertDialogHeader>
            <div className={`w-20 h-20 rounded-3xl mb-6 flex items-center justify-center mx-auto ${tipo === 'entrada' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
              <AlertTriangle strokeWidth={1.5} className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-center text-2xl font-black text-primary uppercase">Confirmar {tipo}</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-bold text-muted-foreground leading-relaxed mt-4">
              Estás por registrar una {tipo} de <span className="text-foreground font-black">{datos.cantidad} {materialSeleccionado?.unidad}</span> de <span className="text-foreground font-black">{materialSeleccionado?.nombre}</span> bajo la responsabilidad de <span className="text-foreground font-black">{trabajadorSeleccionado?.nombre}</span>.
              <br/><br/>
              ¿Deseas proceder con la actualización del inventario?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 sm:justify-center gap-3">
            <AlertDialogCancel disabled={isProcesando} className="h-14 rounded-2xl font-black border-none hover:bg-muted">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); confirmarMovimiento(); }} 
              disabled={isProcesando}
              className={`h-14 rounded-2xl px-10 font-black shadow-xl ${tipo === 'entrada' ? 'bg-primary hover:bg-primary/90' : 'bg-accent hover:bg-accent/90'}`}
            >
              {isProcesando ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirmar Registro"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
