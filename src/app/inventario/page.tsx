
"use client"

import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  Box, 
  Sparkles, 
  Trash2, 
  PenLine,
  Loader2,
  AlertCircle,
  Hash,
  Tag,
  Check,
  XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
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
  const [openCatDialog, setOpenCatDialog] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  
  const [catEditandoId, setCatEditandoId] = useState<string | null>(null)
  const [nombreCatEdit, setNombreCatEdit] = useState('')

  const articulosRef = useMemoFirebase(() => db ? collection(db, 'articulos') : null, [db])
  const categoriasRef = useMemoFirebase(() => db ? collection(db, 'categorias') : null, [db])
  
  const { data: articulos = [], loading } = useCollection(articulosRef)
  const { data: categoriasList = [] } = useCollection(categoriasRef)

  const [formArticulo, setFormArticulo] = useState({
    codigo: '',
    nombre: '',
    categoria: '',
    descripcion: '',
    unidad: 'unidades',
    stockActual: 0,
    stockMinimo: 5
  })

  const filtrados = React.useMemo(() => articulos.filter((a: any) => 
    a.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    a.categoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  ), [articulos, busqueda])

  const manejarCrearCategoria = async () => {
    if (!db || !nuevaCategoria.trim()) return
    addDoc(collection(db, 'categorias'), { nombre: nuevaCategoria.trim() }).then(() => {
      setNuevaCategoria('')
      toast({ title: "Categoría creada" })
    })
  }

  const manejarEditarCategoria = (cat: any) => {
    setCatEditandoId(cat.id)
    setNombreCatEdit(cat.nombre)
  }

  const guardarEdicionCategoria = () => {
    if (!db || !catEditandoId) return
    updateDoc(doc(db, 'categorias', catEditandoId), { nombre: nombreCatEdit.trim() }).then(() => {
      setCatEditandoId(null)
      setNombreCatEdit('')
      toast({ title: "Categoría actualizada" })
    })
  }

  const eliminarCategoria = (id: string) => {
    if (!db) return
    deleteDoc(doc(db, 'categorias', id)).then(() => {
      toast({ title: "Categoría eliminada" })
    })
  }

  const manejarGenerarDescripcion = async () => {
    if (!formArticulo.nombre) {
      toast({ title: "Nombre requerido", description: "Ingresa el nombre del artículo.", variant: "destructive" })
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
      toast({ title: "Error", description: "No se pudo generar la descripción.", variant: "destructive" })
    } finally {
      setIsCargandoIA(false)
    }
  }

  const manejarGuardarArticulo = () => {
    if (!db) return

    if (!formArticulo.nombre || !formArticulo.codigo || !formArticulo.categoria) {
      toast({ title: "Faltan campos", description: "Nombre, código y categoría son obligatorios.", variant: "destructive" })
      return
    }

    const data = {
      ...formArticulo,
      stockActual: Number(formArticulo.stockActual),
      stockMinimo: Number(formArticulo.stockMinimo),
      updatedAt: serverTimestamp()
    }

    if (editandoId) {
      updateDoc(doc(db, 'articulos', editandoId), data)
        .then(() => {
          setOpenDialog(false)
          setEditandoId(null)
          resetForm()
          toast({ title: "Artículo actualizado" })
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `articulos/${editandoId}`, operation: 'update', requestResourceData: data }))
        })
    } else {
      addDoc(collection(db, 'articulos'), {
        ...data,
        createdAt: serverTimestamp()
      }).then(() => {
        setOpenDialog(false)
        resetForm()
        toast({ title: "Artículo registrado" })
      }).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'articulos', operation: 'create', requestResourceData: data }))
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
    deleteDoc(doc(db, 'articulos', id)).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `articulos/${id}`, operation: 'delete' }))
    })
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10">
              <Box strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Inventario</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-14">Control maestro de existencias y categorías.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={openCatDialog} onOpenChange={setOpenCatDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-primary/20 text-primary font-bold hover:bg-primary/5">
                <Tag strokeWidth={1.5} className="mr-2 h-5 w-5" /> Categorías
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-bold">Administrar Categorías</DialogTitle>
                <DialogDescription>Gestiona las clasificaciones de tus materiales.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="flex gap-2">
                  <Input 
                    value={nuevaCategoria} 
                    onChange={(e) => setNuevaCategoria(e.target.value)} 
                    placeholder="Nueva categoría..." 
                    className="h-12 rounded-xl"
                  />
                  <Button onClick={manejarCrearCategoria} className="rounded-xl h-12 w-12 bg-primary">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {categoriasList.map((cat: any) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl group transition-all hover:bg-muted/50">
                      {catEditandoId === cat.id ? (
                        <div className="flex flex-1 gap-2 animate-in slide-in-from-left-2">
                          <Input 
                            value={nombreCatEdit} 
                            onChange={(e) => setNombreCatEdit(e.target.value)} 
                            className="h-9 rounded-lg" 
                            autoFocus
                          />
                          <Button size="sm" onClick={guardarEdicionCategoria} className="h-9 w-9 bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setCatEditandoId(null)} className="h-9 w-9">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-sm pl-2">{cat.nombre}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => manejarEditarCategoria(cat)}>
                              <PenLine className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50" onClick={() => eliminarCategoria(cat.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={() => { resetForm(); setOpenDialog(true); }} className="bg-primary hover:bg-primary/90 shadow-lg font-bold h-12 px-8 rounded-2xl">
            <Plus strokeWidth={2.5} className="mr-2 h-5 w-5" /> Nuevo Artículo
          </Button>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="sm:max-w-[550px] w-[95vw] rounded-3xl border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-primary font-bold text-xl">{editandoId ? 'Editar Artículo' : 'Registrar Artículo'}</DialogTitle>
                <DialogDescription>Introduce los datos técnicos para actualizar el catálogo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" /> SKU / CÓDIGO</Label>
                    <Input value={formArticulo.codigo} onChange={(e) => setFormArticulo({...formArticulo, codigo: e.target.value})} className="h-12 rounded-xl font-bold" placeholder="ART-001" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">NOMBRE</Label>
                    <Input value={formArticulo.nombre} onChange={(e) => setFormArticulo({...formArticulo, nombre: e.target.value})} className="h-12 rounded-xl" placeholder="Ej: Martillo" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">CATEGORÍA</Label>
                    <Select value={formArticulo.categoria} onValueChange={(val) => setFormArticulo({...formArticulo, categoria: val})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasList.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">UNIDAD</Label>
                    <Select value={formArticulo.unidad} onValueChange={(val) => setFormArticulo({...formArticulo, unidad: val})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidades">Unidades</SelectItem>
                        <SelectItem value="metros">Metros</SelectItem>
                        <SelectItem value="kilogramos">Kilogramos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">STOCK MÍNIMO</Label>
                    <Input type="number" value={formArticulo.stockMinimo} onChange={(e) => setFormArticulo({...formArticulo, stockMinimo: Number(e.target.value)})} className="h-12 rounded-xl" />
                  </div>
                  {!editandoId && (
                    <div className="grid gap-2">
                      <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">STOCK INICIAL</Label>
                      <Input type="number" value={formArticulo.stockActual} onChange={(e) => setFormArticulo({...formArticulo, stockActual: Number(e.target.value)})} className="h-12 rounded-xl" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">DESCRIPCIÓN</Label>
                    <Button variant="ghost" size="sm" onClick={manejarGenerarDescripcion} disabled={isCargandoIA} className="h-7 text-[10px] text-accent font-black px-3 rounded-full hover:bg-accent/5">
                      {isCargandoIA ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles strokeWidth={1.5} className="mr-1 h-3 w-3" />} IA ASSIST
                    </Button>
                  </div>
                  <Textarea value={formArticulo.descripcion} onChange={(e) => setFormArticulo({...formArticulo, descripcion: e.target.value})} className="min-h-[100px] rounded-xl resize-none p-4" placeholder="Especificaciones..." />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => setOpenDialog(false)} className="h-12 font-bold rounded-xl">Cancelar</Button>
                <Button onClick={manejarGuardarArticulo} className="bg-primary font-bold h-12 px-10 rounded-xl">Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative w-full">
        <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filtrar por nombre, código o categoría..." className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm font-medium w-full" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-black text-muted-foreground animate-pulse tracking-widest uppercase text-xs">Sincronizando...</div>
        ) : filtrados.length > 0 ? filtrados.map((articulo: any) => (
          <Card key={articulo.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white overflow-hidden rounded-[2rem] ring-1 ring-primary/5">
            <CardHeader className="pb-3 px-8 pt-8">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <div className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Box strokeWidth={1.5} className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground bg-muted/30 px-2 py-1 rounded-md tracking-widest uppercase w-fit">
                    {articulo.codigo || 'S/C'}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={() => abrirEdicion(articulo)}>
                    <PenLine strokeWidth={1.5} className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl" onClick={() => eliminarArticulo(articulo.id)}>
                    <Trash2 strokeWidth={1.5} className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <CardTitle className="text-lg font-black text-primary truncate">{articulo.nombre}</CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground uppercase border-muted/50 mt-1">{articulo.categoria}</Badge>
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-5">
              <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed h-8 font-medium italic">{articulo.descripcion || "Sin descripción."}</p>
              
              <div className="pt-5 border-t border-primary/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Stock Real</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-black ${Number(articulo.stockActual) <= Number(articulo.stockMinimo) ? 'text-destructive' : 'text-primary'}`}>
                      {articulo.stockActual}
                    </span>
                    <span className="text-[11px] font-black uppercase text-muted-foreground">
                      {articulo.unidad?.slice(0, 3)}
                    </span>
                  </div>
                </div>
                {Number(articulo.stockActual) <= (Number(articulo.stockMinimo) || 5) && (
                   <div className="animate-bounce bg-red-50 text-red-600 p-2.5 rounded-2xl">
                      <AlertCircle className="h-5 w-5" />
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="col-span-full py-20 text-center text-muted-foreground opacity-50 uppercase font-black text-xs">No hay artículos</div>
        )}
      </div>
    </div>
  )
}
