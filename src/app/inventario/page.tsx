
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
  AlertCircle,
  Hash,
  X
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
import { Badge } from "@/components/ui/badge"
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
  const [editandoId, setEditandoId] = useState<string | null>(null)
  
  const materialesRef = db ? collection(db, 'materiales') : null
  const { data: materiales = [], loading } = useCollection(materialesRef)

  const [formArticulo, setFormArticulo] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    descripcion: '',
    unidad: 'unidades',
    stockActual: 0,
    stockMinimo: 5
  })

  const filtrados = materiales.filter((a: any) => 
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    a.categoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const manejarGenerarDescripcion = async () => {
    if (!formArticulo.nombre) {
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
        nombreArticulo: formArticulo.nombre,
        categoriaArticulo: formArticulo.categoria
      })
      setFormArticulo(prev => ({ ...prev, descripcion: resultado.descripcionGenerada }))
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

    if (!formArticulo.nombre || !formArticulo.codigo) {
      toast({
        title: "Campos obligatorios",
        description: "El nombre y el código son requeridos para registrar el material.",
        variant: "destructive"
      })
      return
    }

    const data = {
      ...formArticulo,
      stockActual: Number(formArticulo.stockActual),
      stockMinimo: Number(formArticulo.stockMinimo),
      updatedAt: serverTimestamp()
    }

    if (editandoId) {
      updateDoc(doc(db, 'materiales', editandoId), data)
        .then(() => {
          setOpenDialog(false)
          setEditandoId(null)
          resetForm()
          toast({ title: "Material actualizado", description: "Los cambios se guardaron correctamente." })
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `materiales/${editandoId}`, operation: 'update', requestResourceData: data }))
        })
    } else {
      addDoc(collection(db, 'materiales'), {
        ...data,
        createdAt: serverTimestamp()
      }).then(() => {
        setOpenDialog(false)
        resetForm()
        toast({ title: "Artículo registrado", description: "El nuevo material se ha añadido al catálogo." })
      }).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'materiales', operation: 'create', requestResourceData: data }))
      })
    }
  }

  const resetForm = () => {
    setFormArticulo({ codigo: '', nombre: '', categoria: '', descripcion: '', unidad: 'unidades', stockActual: 0, stockMinimo: 5 })
  }

  const abrirEdicion = (articulo: any) => {
    setEditandoId(articulo.id)
    setFormArticulo({
      codigo: articulo.codigo || '',
      nombre: articulo.nombre || '',
      categoria: articulo.categoria || '',
      descripcion: articulo.descripcion || '',
      unidad: articulo.unidad || 'unidades',
      stockActual: articulo.stockActual || 0,
      stockMinimo: articulo.stockMinimo || 5
    })
    setOpenDialog(true)
  }

  const eliminarArticulo = (id: string) => {
    if (!db) return
    deleteDoc(doc(db, 'materiales', id)).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `materiales/${id}`, operation: 'delete' }))
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Gestión de Inventario</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-12">Catálogo de materiales y control de existencias en tiempo real.</p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={(val) => {
          setOpenDialog(val)
          if(!val) {
            setEditandoId(null)
            resetForm()
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditandoId(null); resetForm(); }} className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-sm font-bold h-11 px-6 rounded-xl">
              <Plus strokeWidth={2.5} className="mr-2 h-4 w-4" /> Nuevo Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] w-[95vw] rounded-2xl border-none shadow-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-primary font-bold text-xl">{editandoId ? 'Editar Material' : 'Añadir Nuevo Material'}</DialogTitle>
              <DialogDescription className="font-medium text-xs md:text-sm">
                Completa los datos técnicos del material para mantener el catálogo actualizado.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Hash className="h-3 w-3" /> Código / SKU
                  </Label>
                  <Input 
                    value={formArticulo.codigo}
                    onChange={(e) => setFormArticulo({...formArticulo, codigo: e.target.value})}
                    className="h-11 rounded-lg font-bold" 
                    placeholder="MAT-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Nombre del Material</Label>
                  <Input 
                    value={formArticulo.nombre}
                    onChange={(e) => setFormArticulo({...formArticulo, nombre: e.target.value})}
                    className="h-11 rounded-lg" 
                    placeholder="Ej: Cable de Cobre"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Categoría</Label>
                  <Input 
                    value={formArticulo.categoria}
                    onChange={(e) => setFormArticulo({...formArticulo, categoria: e.target.value})}
                    className="h-11 rounded-lg" 
                    placeholder="Construcción"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Unidad</Label>
                  <Select value={formArticulo.unidad} onValueChange={(val) => setFormArticulo({...formArticulo, unidad: val})}>
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unidades">Unidades</SelectItem>
                      <SelectItem value="metros">Metros</SelectItem>
                      <SelectItem value="kilogramos">Kilogramos</SelectItem>
                      <SelectItem value="litros">Litros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Stock Mínimo</Label>
                  <Input 
                    type="number"
                    value={formArticulo.stockMinimo}
                    onChange={(e) => setFormArticulo({...formArticulo, stockMinimo: Number(e.target.value)})}
                    className="h-11 rounded-lg" 
                  />
                </div>
              </div>

              {!editandoId && (
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Stock Inicial</Label>
                  <Input 
                    type="number"
                    value={formArticulo.stockActual}
                    onChange={(e) => setFormArticulo({...formArticulo, stockActual: Number(e.target.value)})}
                    className="h-11 rounded-lg" 
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Descripción Técnica</Label>
                  <Button variant="outline" size="sm" onClick={manejarGenerarDescripcion} disabled={isCargandoIA} className="h-7 text-[10px] text-accent border-accent/20 font-bold px-3 rounded-full hover:bg-accent/5">
                    {isCargandoIA ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles strokeWidth={1.5} className="mr-1 h-3 w-3" />}
                    Sugerir con IA
                  </Button>
                </div>
                <Textarea 
                  value={formArticulo.descripcion}
                  onChange={(e) => setFormArticulo({...formArticulo, descripcion: e.target.value})}
                  className="min-h-[100px] rounded-lg resize-none p-4"
                  placeholder="Detalles del material..."
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => { setOpenDialog(false); setEditandoId(null); }} className="h-11 font-bold">Cancelar</Button>
              <Button onClick={manejarGuardarArticulo} className="bg-primary font-bold h-11 px-8 rounded-xl">
                {editandoId ? 'Guardar Cambios' : 'Registrar Material'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
        <div className="relative flex-1 w-full">
          <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, código o categoría..." 
            className="pl-11 h-12 rounded-xl bg-white border-none shadow-sm font-medium w-full"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-bold text-muted-foreground animate-pulse">
            Sincronizando catálogo...
          </div>
        ) : filtrados.length > 0 ? filtrados.map((articulo: any) => (
          <Card key={articulo.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white overflow-hidden rounded-2xl ring-1 ring-primary/5">
            <CardHeader className="pb-3 px-6 pt-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Box strokeWidth={1.5} className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black text-muted-foreground bg-muted/30 px-2 py-1 rounded-md tracking-widest uppercase">
                      {articulo.codigo || 'S/C'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => abrirEdicion(articulo)}>
                    <PenLine strokeWidth={1.5} className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => eliminarArticulo(articulo.id)}>
                    <Trash2 strokeWidth={1.5} className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <CardTitle className="text-lg font-black text-primary truncate" title={articulo.nombre}>{articulo.nombre}</CardTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{articulo.categoria}</p>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed h-8 font-medium italic">
                {articulo.descripcion || "Sin descripción técnica registrada."}
              </p>
              
              <div className="pt-4 border-t border-primary/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Existencias</span>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-black ${articulo.stockActual <= articulo.stockMinimo ? 'text-destructive' : 'text-primary'}`}>
                      {articulo.stockActual}
                    </span>
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                      {articulo.unidad?.slice(0, 3)}
                    </span>
                  </div>
                </div>
                {articulo.stockActual <= (articulo.stockMinimo || 5) && (
                   <Badge variant="destructive" className="animate-pulse bg-red-50 text-red-600 border-none shadow-none font-black text-[9px] uppercase tracking-tighter flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Reponer
                   </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-primary/20 opacity-40">
            <Box strokeWidth={1} className="h-20 w-20 text-muted-foreground mb-4" />
            <h3 className="text-xl font-black text-muted-foreground">No se encontraron artículos</h3>
            <p className="text-xs font-bold uppercase tracking-widest mt-2">Prueba ajustando los filtros de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  )
}
