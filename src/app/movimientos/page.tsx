
"use client"

import React, { useState } from 'react'
import { ArrowUpRight, ArrowDownRight, History, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/select"
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

  const articulosRef = useMemoFirebase(() => db ? collection(db, 'articulos') : null, [db])
  const trabajadoresRef = useMemoFirebase(() => db ? collection(db, 'trabajadores') : null, [db])
  
  const { data: articulosData } = useCollection(articulosRef)
  const { data: trabajadoresData } = useCollection(trabajadoresRef)

  const articulos = articulosData || []
  const trabajadores = trabajadoresData || []

  const articuloSeleccionado = React.useMemo(() => articulos.find((m: any) => m.id === datos.articuloId), [articulos, datos.articuloId])
  const trabajadorSeleccionado = React.useMemo(() => trabajadores.find((t: any) => t.id === datos.trabajadorId), [trabajadores, datos.trabajadorId])

  const manejarValidacion = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!datos.articuloId || !datos.trabajadorId || !datos.cantidad) {
      toast({ title: "Datos incompletos", variant: "destructive" })
      return
    }

    const cantidadNum = Number(datos.cantidad)
    if (tipo === 'salida' && (Number(articuloSeleccionado?.stockActual) || 0) < cantidadNum) {
      toast({ title: "Stock insuficiente", variant: "destructive" })
      return
    }

    setIsConfirmOpen(true)
  }

  const confirmarMovimiento = () => {
    if (!db || !articuloSeleccionado || !trabajadorSeleccionado) return

    setIsProcesando(true)
    const cantidadNum = Number(datos.cantidad)
    const articuloDocRef = doc(db, 'articulos', datos.articuloId)
    const nuevoStock = tipo === 'entrada' 
      ? (Number(articuloSeleccionado.stockActual) || 0) + cantidadNum
      : (Number(articuloSeleccionado.stockActual) || 0) - cantidadNum

    const movData = {
      articuloId: datos.articuloId,
      articuloNombre: articuloSeleccionado.nombre,
      trabajadorId: datos.trabajadorId,
      trabajadorNombre: trabajadorSeleccionado.nombre,
      tipo,
      cantidad: cantidadNum,
      fecha: new Date().toISOString(),
      notas: datos.notas,
      createdAt: serverTimestamp()
    }

    addDoc(collection(db, 'movimientosStock'), movData)
      .then(() => {
        updateDoc(articuloDocRef, {
          stockActual: nuevoStock,
          updatedAt: serverTimestamp()
        })
        .then(() => {
          toast({ title: "Movimiento registrado" })
          setDatos({ articuloId: '', trabajadorId: '', cantidad: '', notas: '' })
          setIsProcesando(false)
          setIsConfirmOpen(false)
        })
      })
      .catch((err) => {
        setIsProcesando(false);
        toast({ title: "Error al guardar", variant: "destructive" })
      });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10">
            <History strokeWidth={1.5} className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Operaciones</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className={`cursor-pointer transition-all border-none rounded-[2rem] ${tipo === 'entrada' ? 'ring-2 ring-primary bg-primary/5 shadow-lg' : 'bg-white'}`} onClick={() => setTipo('entrada')}>
          <CardContent className="p-8 text-center space-y-4">
            <div className={`p-5 rounded-2xl mx-auto w-fit ${tipo === 'entrada' ? 'bg-primary text-white' : 'bg-muted/50 text-muted-foreground'}`}>
              <ArrowUpRight className="h-8 w-8" />
            </div>
            <h3 className="font-black text-xl text-primary">Entrada</h3>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all border-none rounded-[2rem] ${tipo === 'salida' ? 'ring-2 ring-accent bg-accent/5 shadow-lg' : 'bg-white'}`} onClick={() => setTipo('salida')}>
          <CardContent className="p-8 text-center space-y-4">
            <div className={`p-5 rounded-2xl mx-auto w-fit ${tipo === 'salida' ? 'bg-accent text-white' : 'bg-muted/50 text-muted-foreground'}`}>
              <ArrowDownRight className="h-8 w-8" />
            </div>
            <h3 className="font-black text-xl text-accent">Salida</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl bg-white rounded-[2.5rem]">
        <CardContent className="p-8 md:p-12">
          <form onSubmit={manejarValidacion} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-3">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Artículo</Label>
                  <Select value={datos.articuloId} onValueChange={(val) => setDatos({...datos, articuloId: val})}>
                    <SelectTrigger className="h-14 rounded-2xl font-bold">
                      <SelectValue placeholder="Busca un artículo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {articulos.map((a: any) => (
                        <SelectItem key={a.id} value={a.id} className="py-4 font-bold">{a.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Responsable</Label>
                  <Select value={datos.trabajadorId} onValueChange={(val) => setDatos({...datos, trabajadorId: val})}>
                    <SelectTrigger className="h-14 rounded-2xl font-bold">
                      <SelectValue placeholder="¿Quién realiza la operación?" />
                    </SelectTrigger>
                    <SelectContent>
                      {trabajadores.map((t: any) => (
                        <SelectItem key={t.id} value={t.id} className="py-4 font-bold">{t.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Cantidad</Label>
                  <Input type="number" placeholder="0" className="h-14 text-2xl font-black rounded-2xl" value={datos.cantidad} onChange={(e) => setDatos({...datos, cantidad: e.target.value})} />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-black text-[11px] uppercase tracking-widest text-muted-foreground">Notas</Label>
                <Textarea placeholder="Detalles técnicos adicionales..." className="min-h-[200px] rounded-2xl font-bold p-6 resize-none" value={datos.notas} onChange={(e) => setDatos({...datos, notas: e.target.value})} />
              </div>
            </div>

            <Button type="submit" size="lg" className={`w-full md:w-auto px-16 font-black h-16 rounded-[1.5rem] ${tipo === 'entrada' ? 'bg-primary' : 'bg-accent'}`}>
              <CheckCircle2 className="mr-3 h-6 w-6" /> Confirmar
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-2xl font-black text-primary uppercase">Confirmar Registro</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-bold">
              ¿Deseas registrar esta operación de {tipo} por {datos.cantidad} unidades?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-8">
            <AlertDialogCancel disabled={isProcesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmarMovimiento(); }} disabled={isProcesando} className={tipo === 'entrada' ? 'bg-primary' : 'bg-accent'}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
