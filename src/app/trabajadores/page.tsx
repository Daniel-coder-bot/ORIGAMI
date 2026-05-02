
"use client"

import React, { useState, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  UserRound, 
  Shield, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  PenLine, 
  ShieldAlert,
  Trash2,
  Briefcase,
  Check
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
  DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

export default function TrabajadoresPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openRolDialog, setOpenRolDialog] = useState(false)
  const [isEditando, setIsEditando] = useState(false)
  const [nuevoRol, setNuevoRol] = useState('')
  const [trabajadorSeleccionadoId, setTrabajadorSeleccionadoId] = useState<string | null>(null)
  
  const [rolEditandoId, setRolEditandoId] = useState<string | null>(null)
  const [nombreRolEdit, setNombreRolEdit] = useState('')

  const trabajadoresRef = useMemoFirebase(() => db ? collection(db, 'trabajadores') : null, [db])
  const rolesRef = useMemoFirebase(() => db ? collection(db, 'roles') : null, [db])
  
  const { data: trabajadoresData, loading } = useCollection(trabajadoresRef)
  const { data: rolesData } = useCollection(rolesRef)

  const trabajadores = trabajadoresData || []
  const rolesList = rolesData || []

  const [formTrabajador, setFormTrabajador] = useState({
    nombre: '',
    correo: '',
    rol: '',
    telefono: '',
    activo: true
  })

  const filtrados = useMemo(() => {
    return trabajadores.filter((t: any) => 
      t.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
      t.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.rol?.toLowerCase().includes(busqueda.toLowerCase())
    )
  }, [trabajadores, busqueda])

  const manejarCrearRol = async () => {
    if (!db || !nuevoRol.trim()) return
    addDoc(collection(db, 'roles'), { nombre: nuevoRol.trim() }).then(() => {
      setNuevoRol('')
      toast({ title: "Rol creado" })
    })
  }

  const manejarEditarRol = (rol: any) => {
    setRolEditandoId(rol.id)
    setNombreRolEdit(rol.nombre)
  }

  const guardarEdicionRol = () => {
    if (!db || !rolEditandoId) return
    updateDoc(doc(db, 'roles', rolEditandoId), { nombre: nombreRolEdit.trim() }).then(() => {
      setRolEditandoId(null)
      setNombreRolEdit('')
      toast({ title: "Rol actualizado" })
    })
  }

  const eliminarRol = (id: string) => {
    if (!db) return
    deleteDoc(doc(db, 'roles', id)).then(() => {
      toast({ title: "Rol eliminado" })
    })
  }

  const abrirDialogNuevo = () => {
    setIsEditando(false)
    setTrabajadorSeleccionadoId(null)
    setFormTrabajador({ nombre: '', correo: '', rol: '', telefono: '', activo: true })
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
      toast({ title: "Faltan datos", variant: "destructive" })
      return
    }

    const payload = {
      ...formTrabajador,
      updatedAt: serverTimestamp()
    }

    if (isEditando && trabajadorSeleccionadoId) {
      updateDoc(doc(db, 'trabajadores', trabajadorSeleccionadoId), payload)
        .then(() => {
          setOpenDialog(false)
          toast({ title: "Perfil actualizado" })
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `trabajadores/${trabajadorSeleccionadoId}`, operation: 'update', requestResourceData: payload }))
        })
    } else {
      addDoc(collection(db, 'trabajadores'), {
        ...payload,
        fechaRegistro: new Date().toISOString(),
        createdAt: serverTimestamp()
      })
        .then(() => {
          setOpenDialog(false)
          toast({ title: "Trabajador registrado" })
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
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-14">Administra roles y perfiles de usuario en tiempo real.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Dialog open={openRolDialog} onOpenChange={setOpenRolDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-primary/20 text-primary font-bold hover:bg-primary/5">
                <Briefcase strokeWidth={1.5} className="mr-2 h-5 w-5" /> Roles
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-bold">Administrar Roles</DialogTitle>
                <DialogDescription>Gestiona los cargos disponibles para tu personal.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="flex gap-2">
                  <Input 
                    value={nuevoRol} 
                    onChange={(e) => setNuevoRol(e.target.value)} 
                    placeholder="Nuevo cargo..." 
                    className="h-12 rounded-xl"
                  />
                  <Button onClick={manejarCrearRol} className="rounded-xl h-12 w-12 bg-primary">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {rolesList.map((rol: any) => (
                    <div key={rol.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl group transition-all hover:bg-muted/50">
                      {rolEditandoId === rol.id ? (
                        <div className="flex flex-1 gap-2 animate-in slide-in-from-left-2">
                          <Input 
                            value={nombreRolEdit} 
                            onChange={(e) => setNombreRolEdit(e.target.value)} 
                            className="h-9 rounded-lg" 
                            autoFocus
                          />
                          <Button size="sm" onClick={guardarEdicionRol} className="h-9 w-9 bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRolEditandoId(null)} className="h-9 w-9">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-sm pl-2">{rol.nombre}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => manejarEditarRol(rol)}>
                              <PenLine className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50" onClick={() => eliminarRol(rol.id)}>
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

          <Button onClick={abrirDialogNuevo} className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg font-bold h-12 px-8 rounded-2xl">
            <Plus strokeWidth={2.5} className="mr-2 h-5 w-5" /> Registrar Trabajador
          </Button>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="sm:max-w-[500px] w-[95vw] rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-primary font-bold text-xl">{isEditando ? 'Editar Trabajador' : 'Nuevo Colaborador'}</DialogTitle>
                <DialogDescription className="font-medium text-xs md:text-sm">Completa el perfil para el control de acceso.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">NOMBRE COMPLETO</Label>
                  <Input value={formTrabajador.nombre} onChange={(e) => setFormTrabajador({...formTrabajador, nombre: e.target.value})} className="h-12 rounded-xl" placeholder="Ej: Roberto Sánchez" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">CORREO CORPORATIVO</Label>
                  <Input type="email" disabled={isEditando} value={formTrabajador.correo} onChange={(e) => setFormTrabajador({...formTrabajador, correo: e.target.value})} className="h-12 rounded-xl" placeholder="email@empresa.com" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">CARGO / ROL</Label>
                    <Select value={formTrabajador.rol} onValueChange={(val) => setFormTrabajador({...formTrabajador, rol: val})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Seleccionar rol..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesList.map((rol: any) => (
                          <SelectItem key={rol.id} value={rol.nombre}>{rol.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">TELÉFONO</Label>
                    <Input value={formTrabajador.telefono} onChange={(e) => setFormTrabajador({...formTrabajador, telefono: e.target.value})} className="h-12 rounded-xl" placeholder="+54 11..." />
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
      </div>

      <div className="relative w-full md:max-w-md">
        <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, correo o cargo..." className="pl-12 h-14 rounded-2xl bg-white border-none shadow-sm font-medium w-full" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-none">
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground py-6 px-10">TRABAJADOR</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">CARGO</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">ESTADO</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground hidden sm:table-cell">CONTACTO</TableHead>
                  <TableHead className="text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground pr-10">ACCIONES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="h-48 text-center font-black text-muted-foreground animate-pulse uppercase tracking-tighter">Sincronizando equipo...</TableCell></TableRow>
                ) : filtrados.map((t: any) => (
                  <TableRow key={t.id} className="hover:bg-primary/5 transition-colors border-muted/20">
                    <TableCell className="py-6 px-10">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                          <UserRound strokeWidth={1.5} className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">{t.nombre}</span>
                          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{t.correo}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-black px-3 py-1 text-[10px] rounded-full border-primary/20 text-primary bg-primary/5">
                        <Shield strokeWidth={1.5} className="mr-1.5 h-3 w-3" /> {t.rol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button onClick={() => toggleEstado(t)} className="transition-transform active:scale-95">
                        {t.activo ? (
                          <span className="flex items-center gap-1.5 text-green-600 font-black text-[9px] bg-green-50 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-red-500 font-black text-[9px] bg-red-50 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                            <XCircle className="h-3.5 w-3.5" /> Suspendido
                          </span>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-bold text-[10px] hidden sm:table-cell">{t.telefono || '---'}</TableCell>
                    <TableCell className="text-right pr-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-muted/50">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2 bg-white">
                          <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground px-3 py-2">Administrar</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => abrirDialogEditar(t)} className="text-xs font-bold rounded-xl px-3 py-3 hover:bg-primary/10 cursor-pointer">
                            <PenLine strokeWidth={1.5} className="h-4 w-4 mr-2 text-primary" /> Editar Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleEstado(t)} className="text-xs font-bold rounded-xl px-3 py-3 hover:bg-accent/10 cursor-pointer">
                            <ShieldAlert strokeWidth={1.5} className="h-4 w-4 mr-2 text-accent" /> {t.activo ? 'Inhabilitar' : 'Habilitar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1.5 bg-muted/30" />
                          <DropdownMenuItem onClick={() => eliminarTrabajador(t.id)} className="text-destructive text-xs font-bold rounded-xl px-3 py-3 hover:bg-red-50 cursor-pointer">
                            <Trash2 strokeWidth={1.5} className="h-4 w-4 mr-2" /> Eliminar Permanente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
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
