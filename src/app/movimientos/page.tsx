
"use client"

import React, { useState } from 'react'
import { ArrowUpRight, ArrowDownRight, UserRound, Box, Calendar, FileText, CheckCircle2, History } from 'lucide-react'
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
import { useFirestore, useCollection } from '@/firebase'
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

export default function MovimientosPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  const [datos, setDatos] = useState({
    articuloId: '',
    cantidad: '',
    notas: ''
  })

  const materialesRef = db ? collection(db, 'materiales') : null
  const { data: materiales = [] } = useCollection(materialesRef)

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!db || !datos.articuloId || !datos.cantidad) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, completa todos los campos requeridos.",
        variant: "destructive"
      })
      return
    }

    const materialSeleccionado = materiales.find((m: any) => m.id === datos.articuloId)
    const cantidadNum = Number(datos.cantidad)

    // Lógica de actualización de stock
    const materialDocRef = doc(db, 'materiales', datos.articuloId)
    const nuevoStock = tipo === 'entrada' 
      ? (materialSeleccionado.stockActual || 0) + cantidadNum
      : (materialSeleccionado.stockActual || 0) - cantidadNum

    if (tipo === 'salida' && nuevoStock < 0) {
      toast({
        title: "Stock insuficiente",
        description: "No puedes retirar más material del que hay disponible.",
        variant: "destructive"
      })
      return
    }

    // Registro de movimiento
    addDoc(collection(db, 'movimientos'), {
      materialId: datos.articuloId,
      materialNombre: materialSeleccionado.nombre,
      tipo,
      cantidad: cantidadNum,
      fecha: new Date().toISOString(),
      notas: datos.notas,
      createdAt: serverTimestamp()
    }).catch(async (err) => {
      const perr = new FirestorePermissionError({
        path: 'movimientos',
        operation: 'create',
        requestResourceData: datos
      })
      errorEmitter.emit('permission-error', perr)
    })

    // Actualización de stock en el material
    updateDoc(materialDocRef, {
      stockActual: nuevoStock
    }).then(() => {
      toast({
        title: "Movimiento registrado",
        description: `Stock de ${materialSeleccionado.nombre} actualizado exitosamente.`,
      })
      setDatos({ articuloId: '', cantidad: '', notas: '' })
    }).catch(async (err) => {
      const perr = new FirestorePermissionError({
        path: `materiales/${datos.articuloId}`,
        operation: 'update',
        requestResourceData: { stockActual: nuevoStock }
      })
      errorEmitter.emit('permission-error', perr)
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <History strokeWidth={1.5} className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Movimientos de Stock</h1>
        </div>
        <p className="text-sm md:text-base text-muted-foreground font-medium pl-12">Actualiza el inventario en Firestore instantáneamente.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all border-none rounded-2xl ${tipo === 'entrada' ? 'ring-2 ring-primary bg-primary/5 shadow-md' : 'bg-white hover:bg-muted/10'}`}
          onClick={() => setTipo('entrada')}
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className={`p-4 rounded-2xl ${tipo === 'entrada' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              <ArrowUpRight strokeWidth={2} className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Entrada</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Suministro de Almacén</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border-none rounded-2xl ${tipo === 'salida' ? 'ring-2 ring-accent bg-accent/5 shadow-md' : 'bg-white hover:bg-muted/10'}`}
          onClick={() => setTipo('salida')}
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className={`p-4 rounded-2xl ${tipo === 'salida' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
              <ArrowDownRight strokeWidth={2} className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Salida</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Despacho de Material</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl overflow-hidden bg-white rounded-3xl">
        <CardHeader className={`${tipo === 'entrada' ? 'bg-primary/5' : 'bg-accent/5'} border-b border-muted/50 p-6`}>
           <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              {tipo === 'entrada' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
              Registro de {tipo}
           </CardTitle>
           <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Persistencia inmediata en Firestore</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-10">
          <form onSubmit={manejarSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Seleccionar Material</Label>
                  <Select 
                    value={datos.articuloId} 
                    onValueChange={(val) => setDatos({...datos, articuloId: val})}
                  >
                    <SelectTrigger className="h-12 rounded-xl font-medium">
                      <SelectValue placeholder="Busca un material..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      {materiales.map((a: any) => (
                        <SelectItem key={a.id} value={a.id} className="text-sm py-3">{a.nombre} <span className="text-[10px] text-muted-foreground">(Stock: {a.stockActual})</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Cantidad</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-12 text-xl font-black rounded-xl"
                    value={datos.cantidad}
                    onChange={(e) => setDatos({...datos, cantidad: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Observaciones (Opcional)</Label>
                <Textarea 
                  placeholder="Detalles del movimiento..." 
                  className="min-h-[160px] rounded-xl font-medium p-4 resize-none"
                  value={datos.notas}
                  onChange={(e) => setDatos({...datos, notas: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-8 border-t border-muted/50 flex justify-end">
              <Button type="submit" size="lg" className={`w-full md:w-auto px-12 font-bold h-14 rounded-2xl shadow-lg ${tipo === 'entrada' ? 'bg-primary hover:bg-primary/90' : 'bg-accent hover:bg-accent/90'}`}>
                <CheckCircle2 strokeWidth={2} className="mr-2 h-5 w-5" /> Confirmar Operación
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
