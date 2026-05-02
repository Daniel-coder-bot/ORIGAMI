
"use client"

import React, { useState } from 'react'
import { 
  Plus, 
  Search, 
  UserRound, 
  Mail, 
  Shield, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  PenLine, 
  UserMinus, 
  ShieldAlert,
  Phone,
  Loader2,
  Trash2
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

export default function TrabajadoresPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [isEditando, setIsEditando] = useState(false)
  const [trabajadorSeleccionadoId, setTrabajadorSeleccionadoId] = useState<string | null>(null)

  const trabajadoresRef = db ? collection(db, 'trabajadores') : null
  const { data: trabajadores = [], loading } = useCollection(trabajadoresRef)

  const [formTrabajador, setFormTrabajador] = useState({
    nombre: '',
    correo: '',
    rol: 'operario',
    telefono: '',
    activo: true
  })

  const filtrados = trabajadores.filter((t: any) => 
    t.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    t.correo.toLowerCase().includes(busqueda.toLowerCase())
  )

  const abrirDialogNuevo = () => {
    setIsEditando(false)
    setTrabajadorSeleccionadoId(null)
    setFormTrabajador({ nombre: '', correo: '', rol: 'operario', telefono: '', activo: true })
    setOpenDialog(true)
  }

  const abrirDialogEditar = (trabajador: any) => {
    setIsEditando(true)
    setTrabajadorSeleccionadoId(trabajador.id)
    setFormTrabajador({
      nombre: trabajador.nombre,
      correo: trabajador.correo,
      rol: trabajador.rol,
      telefono: trabajador.telefono || '',
      activo: trabajador.activo
    })
    setOpenDialog(true)
  }

  const manejarGuardarTrabajador = () => {
    if (!db) return

    if (!formTrabajador.nombre || !formTrabajador.correo) {
      toast({ title: "Faltan datos", description: "Nombre y correo son obligatorios.", variant: "destructive" })
      return
    }

    // Validar duplicados por correo (solo si es nuevo)
    if (!isEditando) {
      const existe = trabajadores.some((t: any) => t.correo.toLowerCase() === formTrabajador.correo.toLowerCase())
      if (existe) {
        toast({ title: "Correo duplicado", description: "Ya existe un trabajador con este correo electrónico.", variant: "destructive" })
        return
      }
    }

    const payload = {
      ...formTrabajador,
      updatedAt: serverTimestamp(),
      ...(isEditando ? {} : { fechaRegistro: new Date().toISOString() })
    }

    if (isEditando && trabajadorSeleccionadoId) {
      updateDoc(doc(db, 'trabajadores', trabajadorSeleccionadoId), payload)
        .then(() => {
          setOpenDialog(false)
          toast({ title: "Actualizado", description: "Perfil de trabajador actualizado correctamente." })
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `trabajadores/${trabajadorSeleccionadoId}`, operation: 'update', requestResourceData: payload }))
        })
    } else {
      addDoc(collection(db, 'trabajadores'), payload)
        .then(() => {
          setOpenDialog(false)
          toast({ title: "Registrado", description: "Nuevo trabajador añadido exitosamente." })
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'trabajadores', operation: 'create', requestResourceData: payload }))
        })
    }
  }

  const eliminarTrabajador = (id: string) => {
    if (!db) return
    deleteDoc(doc(db, 'trabajadores', id)).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `trabajadores/${id}`, operation: 'delete' }))
    })
  }

  const toggleEstado = (trabajador: any) => {
    if (!db) return
    updateDoc(doc(db, 'trabajadores', trabajador.id), { activo: !trabajador.activo })
  }

  const getBadgeVariant = (rol: string) => {
    switch (rol) {
      case 'administrador': return 'default'
      case 'supervisor': return 'secondary'
      case 'operario': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <UserRound strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Gestión de Personal</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-12">Administra los accesos y perfiles de los trabajadores en tiempo real.</p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <Button onClick={abrirDialogNuevo} className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-sm font-bold h-11 px-6 rounded-xl">
            <Plus strokeWidth={2.5} className="mr-2 h-4 w-4" /> Registrar Trabajador
          </Button>
          <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-2xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary font-bold text-xl">{isEditando ? 'Editar Trabajador' : 'Registrar Trabajador'}</DialogTitle>
              <DialogDescription className="font-medium text-xs md:text-sm">
                Completa la información del perfil para persistir en Firestore.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label className="font-bold text-[10px] uppercase tracking-wider">Nombre Completo</Label>
                <Input 
                  value={formTrabajador.nombre}
                  onChange={(e) => setFormTrabajador({...formTrabajador, nombre: e.target.value})}
                  className="h-11 rounded-lg" 
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-[10px] uppercase tracking-wider">Correo Electrónico</Label>
                <Input 
                  type="email"
                  disabled={isEditando}
                  value={formTrabajador.correo}
                  onChange={(e) => setFormTrabajador({...formTrabajador, correo: e.target.value})}
                  className="h-11 rounded-lg" 
                  placeholder="juan@empresa.com"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider">Rol</Label>
                  <Select 
                    value={formTrabajador.rol} 
                    onValueChange={(val) => setFormTrabajador({...formTrabajador, rol: val})}
                  >
                    <SelectTrigger className="h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operario">Operario</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="administrador">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider">Teléfono</Label>
                  <Input 
                    value={formTrabajador.telefono}
                    onChange={(e) => setFormTrabajador({...formTrabajador, telefono: e.target.value})}
                    className="h-11 rounded-lg" 
                    placeholder="+54 11..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpenDialog(false)} className="h-11 font-bold">Cancelar</Button>
              <Button onClick={manejarGuardarTrabajador} className="bg-primary font-bold h-11 px-8 rounded-xl">Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center bg-muted/30 rounded-xl px-4 py-2 mb-6 w-full md:max-w-md border-none focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search strokeWidth={1.5} className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
            <Input 
              placeholder="Buscar por nombre o correo..." 
              className="border-none bg-transparent focus-visible:ring-0 h-8 text-sm w-full font-medium"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-muted/50 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-4 px-6">Trabajador</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Rol</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Estado</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Contacto</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="h-40 text-center animate-pulse font-bold text-muted-foreground">Cargando trabajadores...</TableCell></TableRow>
                  ) : filtrados.map((t: any) => (
                    <TableRow key={t.id} className="hover:bg-primary/5 transition-colors border-muted/50">
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0 shadow-inner">
                            <UserRound strokeWidth={1.5} className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm truncate">{t.nombre}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium truncate">
                              <Mail strokeWidth={1.5} className="h-3 w-3 flex-shrink-0" /> {t.correo}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(t.rol)} className="capitalize font-bold px-3 py-1 text-[10px] rounded-full border-none shadow-sm">
                          <Shield strokeWidth={1.5} className="mr-1.5 h-3 w-3" />
                          {t.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleEstado(t)} className="transition-transform active:scale-95">
                          {t.activo ? (
                            <span className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] whitespace-nowrap bg-green-50 px-2 py-1 rounded-full w-fit">
                              <CheckCircle2 strokeWidth={2} className="h-3 w-3" /> Activo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-red-500 font-bold text-[10px] whitespace-nowrap bg-red-50 px-2 py-1 rounded-full w-fit">
                              <XCircle strokeWidth={2} className="h-3 w-3" /> Inactivo
                            </span>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-bold text-[10px] hidden sm:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <Phone strokeWidth={1.5} className="h-3 w-3" /> {t.telefono || 'Sin tel.'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-muted/50">
                              <MoreHorizontal strokeWidth={1.5} className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-none shadow-xl p-2">
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5">Opciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => abrirDialogEditar(t)} className="text-xs font-bold rounded-lg cursor-pointer flex gap-2 items-center px-2 py-2">
                              <PenLine strokeWidth={1.5} className="h-4 w-4 text-primary" /> Editar Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleEstado(t)} className="text-xs font-bold rounded-lg cursor-pointer flex gap-2 items-center px-2 py-2">
                              <ShieldAlert strokeWidth={1.5} className="h-4 w-4 text-accent" /> {t.activo ? 'Suspender' : 'Activar'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-muted/50" />
                            <DropdownMenuItem onClick={() => eliminarTrabajador(t.id)} className="text-destructive text-xs font-bold rounded-lg cursor-pointer flex gap-2 items-center px-2 py-2 hover:bg-red-50">
                              <Trash2 strokeWidth={1.5} className="h-4 w-4" /> Eliminar Registro
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && filtrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-muted-foreground font-bold text-sm">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <UserRound strokeWidth={1} className="h-12 w-12" />
                          No se hallaron resultados en Firestore.
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
