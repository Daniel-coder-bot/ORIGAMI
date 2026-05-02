
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
  ShieldAlert,
  Phone,
  Trash2,
  Briefcase
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
    rol: '',
    telefono: '',
    activo: true
  })

  const filtrados = trabajadores.filter((t: any) => 
    t.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    t.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    t.rol?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const abrirDialogNuevo = () => {
    setIsEditando(false)
    setTrabajadorSeleccionadoId(null)
    setFormTrabajador({ nombre: '', correo: '', rol: 'Operario', telefono: '', activo: true })
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

    if (!formTrabajador.nombre || !formTrabajador.correo || !formTrabajador.rol) {
      toast({ title: "Faltan datos", description: "Nombre, correo y rol son obligatorios.", variant: "destructive" })
      return
    }

    if (!isEditando) {
      const existe = trabajadores.some((t: any) => t.correo?.toLowerCase() === formTrabajador.correo.toLowerCase())
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

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10">
              <UserRound strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Gestión de Personal</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-14">Administra los accesos y perfiles de los trabajadores en tiempo real.</p>
        </div>
        
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <Button onClick={abrirDialogNuevo} className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg font-bold h-12 px-8 rounded-2xl">
            <Plus strokeWidth={2.5} className="mr-2 h-5 w-5" /> Registrar Trabajador
          </Button>
          <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-primary font-bold text-xl">{isEditando ? 'Editar Trabajador' : 'Registrar Trabajador'}</DialogTitle>
              <DialogDescription className="font-medium text-xs md:text-sm">
                Completa la información del perfil para guardarla en el sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Nombre Completo</Label>
                <Input 
                  value={formTrabajador.nombre}
                  onChange={(e) => setFormTrabajador({...formTrabajador, nombre: e.target.value})}
                  className="h-12 rounded-xl border-muted/50 focus:border-primary" 
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Correo Electrónico</Label>
                <Input 
                  type="email"
                  disabled={isEditando}
                  value={formTrabajador.correo}
                  onChange={(e) => setFormTrabajador({...formTrabajador, correo: e.target.value})}
                  className="h-12 rounded-xl border-muted/50 focus:border-primary" 
                  placeholder="juan@empresa.com"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Rol / Cargo</Label>
                  <div className="relative">
                    <Input 
                      value={formTrabajador.rol}
                      onChange={(e) => setFormTrabajador({...formTrabajador, rol: e.target.value})}
                      className="h-12 rounded-xl border-muted/50 focus:border-primary pl-10" 
                      placeholder="Ej: Operario, Jefe..."
                    />
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Teléfono</Label>
                  <Input 
                    value={formTrabajador.telefono}
                    onChange={(e) => setFormTrabajador({...formTrabajador, telefono: e.target.value})}
                    className="h-12 rounded-xl border-muted/50 focus:border-primary" 
                    placeholder="+54 11..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpenDialog(false)} className="h-12 font-bold rounded-xl">Cancelar</Button>
              <Button onClick={manejarGuardarTrabajador} className="bg-primary font-bold h-12 px-10 rounded-xl shadow-lg">Guardar Registro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardContent className="p-4 md:p-8">
          <div className="flex items-center bg-muted/30 rounded-2xl px-5 py-3 mb-8 w-full md:max-w-md border-none focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search strokeWidth={1.5} className="h-4 w-4 text-muted-foreground mr-3 flex-shrink-0" />
            <Input 
              placeholder="Buscar por nombre, correo o rol..." 
              className="border-none bg-transparent focus-visible:ring-0 h-8 text-sm w-full font-medium"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="rounded-3xl border border-muted/30 overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground py-5 px-8">Trabajador</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Rol / Cargo</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Estado</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Contacto</TableHead>
                    <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground pr-8">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="h-48 text-center animate-pulse font-bold text-muted-foreground">Sincronizando equipo...</TableCell></TableRow>
                  ) : filtrados.map((t: any) => (
                    <TableRow key={t.id} className="hover:bg-primary/5 transition-colors border-muted/20">
                      <TableCell className="py-5 px-8">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary flex-shrink-0 shadow-inner group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                            <UserRound strokeWidth={1.5} className="h-6 w-6" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm truncate text-foreground">{t.nombre}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium truncate uppercase tracking-tighter">
                              <Mail strokeWidth={1.5} className="h-3 w-3 flex-shrink-0" /> {t.correo}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize font-black px-3 py-1 text-[10px] rounded-full border-primary/20 text-primary bg-primary/5">
                          <Shield strokeWidth={1.5} className="mr-1.5 h-3 w-3" />
                          {t.rol}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleEstado(t)} className="transition-transform active:scale-95">
                          {t.activo ? (
                            <span className="flex items-center gap-1.5 text-green-600 font-black text-[9px] whitespace-nowrap bg-green-50 px-2.5 py-1.5 rounded-full w-fit uppercase tracking-tighter">
                              <CheckCircle2 strokeWidth={2} className="h-3.5 w-3.5" /> Activo
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-red-500 font-black text-[9px] whitespace-nowrap bg-red-50 px-2.5 py-1.5 rounded-full w-fit uppercase tracking-tighter">
                              <XCircle strokeWidth={2} className="h-3.5 w-3.5" /> Inactivo
                            </span>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-bold text-[10px] hidden sm:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <Phone strokeWidth={1.5} className="h-3.5 w-3.5" /> {t.telefono || 'Sin tel.'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-muted/50">
                              <MoreHorizontal strokeWidth={1.5} className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2 bg-white">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-3 py-2">Gestión de Perfil</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => abrirDialogEditar(t)} className="text-xs font-bold rounded-xl cursor-pointer flex gap-3 items-center px-3 py-3 hover:bg-primary/10 transition-colors">
                              <PenLine strokeWidth={1.5} className="h-4 w-4 text-primary" /> Editar Datos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleEstado(t)} className="text-xs font-bold rounded-xl cursor-pointer flex gap-3 items-center px-3 py-3 hover:bg-accent/10 transition-colors">
                              <ShieldAlert strokeWidth={1.5} className="h-4 w-4 text-accent" /> {t.activo ? 'Suspender Acceso' : 'Restaurar Acceso'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1.5 bg-muted/30" />
                            <DropdownMenuItem onClick={() => eliminarTrabajador(t.id)} className="text-destructive text-xs font-bold rounded-xl cursor-pointer flex gap-3 items-center px-3 py-3 hover:bg-red-50 transition-colors">
                              <Trash2 strokeWidth={1.5} className="h-4 w-4" /> Eliminar Permanentemente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && filtrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-black">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <UserRound strokeWidth={1} className="h-16 w-16" />
                          NO SE ENCONTRARON RESULTADOS
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
