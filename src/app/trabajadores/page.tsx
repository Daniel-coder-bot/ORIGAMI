
"use client"

import React, { useState, useMemo } from 'react'
import { 
  Plus, 
  Search, 
  UserRound, 
  MoreHorizontal, 
  PenLine, 
  Trash2,
  Briefcase,
  Check,
  XCircle
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, doc, serverTimestamp, deleteDoc, setDoc, updateDoc, addDoc } from 'firebase/firestore'
import { useToast } from '@/hooks/use-toast'
import { errorEmitter } from '@/firebase/error-emitter'
import { FirestorePermissionError } from '@/firebase/errors'

const PROTECTED_ROLES = ["Administrador", "Gestor de Proyecto", "Trabajador"]

export default function TrabajadoresPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openRoleDialog, setOpenRoleDialog] = useState(false)
  const [isEditando, setIsEditando] = useState(false)
  const [trabajadorSeleccionadoId, setTrabajadorSeleccionadoId] = useState<string | null>(null)
  
  const [nuevoCargo, setNuevoCargo] = useState('')
  const [cargoEditandoId, setCargoEditandoId] = useState<string | null>(null)
  const [nombreCargoEdit, setNombreCargoEdit] = useState('')

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
    activo: true,
    password: ''
  })

  const filtrados = useMemo(() => {
    if (!trabajadores) return []
    return trabajadores.filter((t: any) => 
      t.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
      t.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.rol?.toLowerCase().includes(busqueda.toLowerCase())
    )
  }, [trabajadores, busqueda])

  const manejarCrearCargo = async () => {
    if (!db || !nuevoCargo.trim()) return
    addDoc(collection(db, 'roles'), { nombre: nuevoCargo.trim() }).then(() => {
      setNuevoCargo('')
      toast({ title: "Cargo creado" })
      setTimeout(() => window.location.reload(), 500)
    })
  }

  const manejarEditarCargo = (rol: any) => {
    if (PROTECTED_ROLES.includes(rol.nombre)) return
    setCargoEditandoId(rol.id)
    setNombreCargoEdit(rol.nombre)
  }

  const guardarEdicionCargo = () => {
    if (!db || !cargoEditandoId) return
    updateDoc(doc(db, 'roles', cargoEditandoId), { nombre: nombreCargoEdit.trim() }).then(() => {
      setCargoEditandoId(null)
      setNombreCargoEdit('')
      toast({ title: "Cargo actualizado" })
      setTimeout(() => window.location.reload(), 500)
    })
  }

  const eliminarCargo = (id: string, nombre: string) => {
    if (!db || PROTECTED_ROLES.includes(nombre)) return
    deleteDoc(doc(db, 'roles', id)).then(() => {
      toast({ title: "Cargo eliminado" })
      setTimeout(() => window.location.reload(), 500)
    })
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
      const docRef = doc(db, 'trabajadores', trabajadorSeleccionadoId)
      updateDoc(docRef, payload)
        .then(() => {
          if (payload.rol === 'Administrador' || payload.rol === 'Gestor de Proyecto') {
            setDoc(doc(db, 'usuarios', trabajadorSeleccionadoId), {
              email: payload.correo,
              password: payload.password,
              nombre: payload.nombre,
              role: payload.rol
            }, { merge: true })
          }
          toast({ title: "Perfil actualizado" })
          setOpenDialog(false)
          setTimeout(() => window.location.reload(), 800)
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: payload
          }))
        })
    } else {
      const colRef = collection(db, 'trabajadores')
      const docData = {
        ...payload,
        fechaRegistro: new Date().toISOString(),
        createdAt: serverTimestamp()
      }
      addDoc(colRef, docData)
        .then((docRef) => {
          if (payload.rol === 'Administrador' || payload.rol === 'Gestor de Proyecto') {
            setDoc(doc(db, 'usuarios', docRef.id), {
              email: payload.correo,
              password: payload.password,
              nombre: payload.nombre,
              role: payload.rol
            }, { merge: true })
          }
          toast({ title: "Trabajador registrado" })
          setOpenDialog(false)
          setTimeout(() => window.location.reload(), 800)
        })
        .catch(async (err) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'trabajadores',
            operation: 'create',
            requestResourceData: docData
          }))
        })
    }
  }

  const abrirDialogNuevo = () => {
    setIsEditando(false)
    setTrabajadorSeleccionadoId(null)
    setFormTrabajador({ nombre: '', correo: '', rol: '', telefono: '', activo: true, password: '' })
    setOpenDialog(true)
  }

  const abrirDialogEditar = (trabajador: any) => {
    setIsEditando(true)
    setTrabajadorSeleccionadoId(trabajador.id)
    setFormTrabajador({
      nombre: trabajador.nombre || '',
      correo: trabajador.correo || '',
      rol: trabajador.rol || '',
      telefono: trabajador.telefono || '',
      activo: trabajador.activo ?? true,
      password: trabajador.password || ''
    })
    setOpenDialog(true)
  }

  const eliminarTrabajador = (id: string) => {
    if (!db) return
    const docRef = doc(db, 'trabajadores', id)
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Trabajador eliminado" })
        setTimeout(() => window.location.reload(), 800)
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete'
        }))
      })
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10">
              <UserRound strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Personal</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-medium pl-14">Administra el equipo y roles.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Dialog open={openRoleDialog} onOpenChange={setOpenRoleDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-primary/20 text-primary font-bold hover:bg-primary/5">
                <Briefcase strokeWidth={1.5} className="mr-2 h-5 w-5" /> Gestionar Cargos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-bold">Cargos del Sistema</DialogTitle>
                <DialogDescription>Define los roles disponibles para el personal.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                <div className="flex gap-2">
                  <Input 
                    value={nuevoCargo} 
                    onChange={(e) => setNuevoCargo(e.target.value)} 
                    placeholder="Nuevo cargo..." 
                    className="h-12 rounded-xl"
                  />
                  <Button onClick={manejarCrearCargo} className="rounded-xl h-12 w-12 bg-primary">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {/* Roles fijos */}
                  {PROTECTED_ROLES.map((role) => (
                    <div key={role} className="flex items-center justify-between p-3 bg-muted/10 rounded-2xl opacity-60">
                      <span className="font-bold text-sm pl-2">{role}</span>
                      <Badge variant="outline" className="text-[9px] uppercase">Sistema</Badge>
                    </div>
                  ))}
                  {/* Roles personalizados */}
                  {(rolesList || []).map((rol: any) => (
                    <div key={rol.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl group transition-all hover:bg-muted/50">
                      {cargoEditandoId === rol.id ? (
                        <div className="flex flex-1 gap-2 animate-in slide-in-from-left-2">
                          <Input 
                            value={nombreCargoEdit} 
                            onChange={(e) => setNombreCargoEdit(e.target.value)} 
                            className="h-9 rounded-lg" 
                            autoFocus
                          />
                          <Button size="sm" onClick={guardarEdicionCargo} className="h-9 w-9 bg-green-600 hover:bg-green-700">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setCargoEditandoId(null)} className="h-9 w-9">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-bold text-sm pl-2">{rol.nombre}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => manejarEditarCargo(rol)}>
                              <PenLine className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-red-50" onClick={() => eliminarCargo(rol.id, rol.nombre)}>
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

          <Button onClick={abrirDialogNuevo} className="bg-primary font-bold h-12 px-8 rounded-2xl">
            <Plus strokeWidth={2.5} className="mr-2 h-5 w-5" /> Registrar Persona
          </Button>

          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-10">
              <DialogHeader>
                <DialogTitle className="text-primary font-bold text-xl">{isEditando ? 'Editar Trabajador' : 'Nuevo Colaborador'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase">Nombre Completo</Label>
                  <Input value={formTrabajador.nombre} onChange={(e) => setFormTrabajador({...formTrabajador, nombre: e.target.value})} className="h-12 rounded-xl font-bold" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase">Correo</Label>
                  <Input type="email" value={formTrabajador.correo} onChange={(e) => setFormTrabajador({...formTrabajador, correo: e.target.value})} className="h-12 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold text-[10px] uppercase">Cargo</Label>
                  <Select value={formTrabajador.rol} onValueChange={(val) => setFormTrabajador({...formTrabajador, rol: val})}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador" className="font-bold">Administrador</SelectItem>
                      <SelectItem value="Gestor de Proyecto" className="font-bold">Gestor de Proyecto</SelectItem>
                      <SelectItem value="Trabajador" className="font-bold">Trabajador</SelectItem>
                      {(rolesList || []).map((rol: any) => (
                        <SelectItem key={rol.id} value={rol.nombre} className="font-bold">{rol.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(formTrabajador.rol === 'Administrador' || formTrabajador.rol === 'Gestor de Proyecto') && (
                  <div className="grid gap-2">
                    <Label className="font-bold text-[10px] uppercase text-primary">Contraseña de acceso</Label>
                    <Input type="password" value={formTrabajador.password} onChange={(e) => setFormTrabajador({...formTrabajador, password: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={manejarGuardarTrabajador} className="bg-primary font-bold h-12 w-full rounded-xl shadow-lg">Confirmar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative w-full md:max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-12 h-14 rounded-2xl bg-white shadow-sm border-none font-medium" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-none">
                <TableHead className="font-black text-[10px] uppercase tracking-widest py-6 px-10">Trabajador</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest">Cargo</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest">Estado</TableHead>
                <TableHead className="text-right font-black text-[10px] uppercase tracking-widest pr-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-48 text-center animate-pulse">Cargando equipo...</TableCell></TableRow>
              ) : filtrados.length > 0 ? filtrados.map((t: any) => (
                <TableRow key={t.id} className="hover:bg-primary/5 border-muted/20">
                  <TableCell className="py-6 px-10">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{t.nombre}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{t.correo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold text-[10px]">{t.rol}</Badge>
                  </TableCell>
                  <TableCell>
                    {t.activo ? (
                      <span className="text-green-600 font-bold text-[10px] bg-green-50 px-3 py-1 rounded-full uppercase">Activo</span>
                    ) : (
                      <span className="text-red-500 font-bold text-[10px] bg-red-50 px-3 py-1 rounded-full uppercase">Suspendido</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-10 w-10 p-0 rounded-full">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2">
                        <DropdownMenuItem onClick={() => abrirDialogEditar(t)} className="font-bold cursor-pointer">
                          <PenLine className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => eliminarTrabajador(t.id)} className="text-destructive font-bold cursor-pointer">
                          <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={4} className="h-48 text-center text-muted-foreground font-bold uppercase text-xs tracking-widest">No hay personal registrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
