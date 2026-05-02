
"use client"

import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  Box, 
  Layers, 
  Sparkles, 
  Trash2, 
  PenLine,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFirestore, useCollection } from '@/firebase'
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { generarDescripcionArticuloInventario } from '@/ai/flows/generate-inventory-item-description-flow'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

export default function InventarioPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [isCargandoIA, setIsCargandoIA] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  
  const materialesRef = db ? collection(db, 'materiales') : null
  const { data: materiales = [], loading } = useCollection(materialesRef)

  const [nuevoArticulo, setNuevoArticulo] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    unidad: 'unidades',
    stockActual: 0,
    stockMinimo: 5
  })

  const filtrados = materiales.filter((a: any) => 
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    a.categoria.toLowerCase().includes(busqueda.toLowerCase())
  )

  const manejarGenerarDescripcion = async () => {
    if (!nuevoArticulo.nombre) {
      toast({
        title: "Nombre requerido",
        description: "Ingresa el nombre del artículo para que la IA pueda generar una descripción.",
        variant: "destructive"
      })
      return
    }

    setIsCargandoIA(true)
    try {
      const resultado = await generarDescripcionArticuloInventario({
        nombreArticulo: nuevoArticulo.nombre,
        categoriaArticulo: nuevoArticulo.categoria
      })
      setNuevoArticulo(prev => ({ ...prev, descripcion: resultado.descripcionGenerada }))
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar la descripción asistida por IA.",
        variant: "destructive"
      })
    } finally {
      setIsCargandoIA(false)
    }
  }

  const manejarGuardarArticulo = () => {
    if (!db) return

    addDoc(collection(db, 'materiales'), {
      ...nuevoArticulo,
      stockActual: Number(nuevoArticulo.stockActual),
      stockMinimo: Number(nuevoArticulo.stockMinimo),
      createdAt: serverTimestamp()
    }).then(() => {
      setOpenDialog(false)
      setNuevoArticulo({ nombre: '', categoria: '', descripcion: '', unidad: 'unidades', stockActual: 0, stockMinimo: 5 })
      toast({
        title: "Artículo guardado",
        description: "El nuevo artículo se ha registrado en Firestore.",
      })
    }).catch(async (err) => {
      const perr = new FirestorePermissionError({
        path: 'materiales',
        operation: 'create',
        requestResourceData: nuevoArticulo
      })
      errorEmitter.emit('permission-error', perr)
    })
  }

  const eliminarArticulo = (id: string) => {
    if (!db) return
    deleteDoc(doc(db, 'materiales', id)).catch(async (err) => {
      const perr = new FirestorePermissionError({
        path: `materiales/${id}`,
        operation: 'delete'
      })
      errorEmitter.emit('permission-error', perr)
    })
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Box strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Catálogo de Artículos</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-12">Gestiona el inventario almacenado en tiempo real.</p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-sm font-bold h-11 px-6 rounded-xl">
              <Plus strokeWidth={2.5} className="mr-2 h-4 w-4" /> Nuevo Artículo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-2xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary font-bold text-xl">Añadir Nuevo Artículo</DialogTitle>
              <DialogDescription className="font-medium text-xs md:text-sm">
                Registra un nuevo material en la base de datos de Firestore.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label className="font-bold text-[10px] uppercase tracking-wider">Nombre del Producto</Label>
                <Input 
                  value={nuevoArticulo.nombre}
                  onChange={(e) => setNuevoArticulo({...nuevoArticulo, nombre: e.target.value})}
                  className="h-11 rounded-lg" 
                  placeholder="Ej: Cable de Cobre"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider">Categoría</Label>
                  <Input 
                    value={nuevoArticulo.categoria}
                    onChange={(e) => setNuevoArticulo({...nuevoArticulo, categoria: e.target.value})}
                    className="h-11 rounded-lg" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider">Stock Mínimo</Label>
                  <Input 
                    type="number"
                    value={nuevoArticulo.stockMinimo}
                    onChange={(e) => setNuevoArticulo({...nuevoArticulo, stockMinimo: Number(e.target.value)})}
                    className="h-11 rounded-lg" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-[10px] uppercase tracking-wider">Descripción</Label>
                  <Button variant="outline" size="sm" onClick={manejarGenerarDescripcion} disabled={isCargandoIA} className="h-7 text-[10px] text-accent font-bold px-3 rounded-full">
                    {isCargandoIA ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles strokeWidth={1.5} className="mr-1 h-3 w-3" />}
                    IA
                  </Button>
                </div>
                <Textarea 
                  value={nuevoArticulo.descripcion}
                  onChange={(e) => setNuevoArticulo({...nuevoArticulo, descripcion: e.target.value})}
                  className="min-h-[100px] rounded-lg resize-none"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpenDialog(false)} className="h-11 font-bold">Cancelar</Button>
              <Button onClick={manejarGuardarArticulo} className="bg-primary font-bold h-11 px-8 rounded-xl">Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center bg-white rounded-xl px-4 py-2 border-none shadow-sm w-full md:max-w-md">
        <Search strokeWidth={1.5} className="h-4 w-4 text-muted-foreground mr-2" />
        <Input 
          placeholder="Buscar artículos..." 
          className="border-none bg-transparent focus-visible:ring-0 h-8 text-sm w-full font-medium"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-bold text-muted-foreground animate-pulse">Cargando catálogo...</div>
        ) : filtrados.map((articulo: any) => (
          <Card key={articulo.id} className="group hover:shadow-lg transition-all border-none bg-white overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-primary/5 text-primary">
                  <Box strokeWidth={1.5} className="h-6 w-6" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => eliminarArticulo(articulo.id)}>
                    <Trash2 strokeWidth={1.5} className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="mt-4 text-lg font-bold truncate">{articulo.nombre}</CardTitle>
              <Badge variant="outline" className="mt-1 font-black text-[9px] uppercase tracking-widest bg-muted/30 border-none">
                {articulo.categoria}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-8">
                {articulo.descripcion}
              </p>
              
              <div className="pt-4 border-t border-muted/50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Existencias</span>
                  <span className={`text-2xl font-black ${articulo.stockActual <= articulo.stockMinimo ? 'text-destructive' : 'text-primary'}`}>
                    {articulo.stockActual} <span className="text-xs font-bold uppercase text-muted-foreground ml-0.5">{articulo.unidad.slice(0, 3)}</span>
                  </span>
                </div>
                {articulo.stockActual <= articulo.stockMinimo && (
                   <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 animate-pulse">
                      <AlertCircle strokeWidth={1.5} className="h-5 w-5" />
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
