
"use client"

import React, { useState } from 'react'
import { Database, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useFirestore } from '@/firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, limit, doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

const CATEGORIAS_SEED = [
  "Herramientas Manuales", "Material Eléctrico", "Fontanería", 
  "Equipo de Seguridad (EPP)", "Pintura y Acabados", "Tornillería y Fijación", 
  "Herramientas Eléctricas", "Construcción Civil", "Iluminación", "Limpieza Industrial"
];

const TRABAJADORES_SEED = [
  { nombre: "Mauricio Fabián Reyes Jiménez", rol: "Administrador", correo: "mauricio@admin.com" },
  { nombre: "Juan Pérez", rol: "Trabajador", correo: "juan.perez@obrero.com" },
  { nombre: "María García", rol: "Gestor de Proyecto", correo: "maria.garcia@gestor.com" },
  { nombre: "Carlos Ruiz", rol: "Trabajador", correo: "carlos.ruiz@obrero.com" },
  { nombre: "Elena Martínez", rol: "Trabajador", correo: "elena.mtz@obrero.com" },
  { nombre: "Roberto Sánchez", rol: "Trabajador", correo: "roberto.s@obrero.com" },
  { nombre: "Lucía Torres", rol: "Trabajador", correo: "lucia.t@obrero.com" },
  { nombre: "David López", rol: "Trabajador", correo: "david.l@obrero.com" },
  { nombre: "Sofía Castro", rol: "Trabajador", correo: "sofia.c@obrero.com" },
  { nombre: "Miguel Ángel", rol: "Trabajador", correo: "miguel.a@obrero.com" }
];

export default function SeedPage() {
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const handleSeed = async () => {
    if (!db) return
    setLoading(true)
    setProgress(5)
    setStatus("Iniciando generación de datos...")

    try {
      // 1. Crear Categorías
      setStatus("Generando categorías...")
      const catIds: string[] = []
      for (const catName of CATEGORIAS_SEED) {
        const docRef = await addDoc(collection(db, 'categorias'), { nombre: catName })
        catIds.push(docRef.id)
      }
      setProgress(20)

      // 2. Crear Trabajadores
      setStatus("Generando perfiles de trabajadores...")
      const trabIds: {id: string, nombre: string}[] = []
      for (const t of TRABAJADORES_SEED) {
        const docRef = await addDoc(collection(db, 'trabajadores'), {
          ...t,
          activo: true,
          telefono: "555-0100",
          password: "1234",
          createdAt: serverTimestamp()
        })
        trabIds.push({ id: docRef.id, nombre: t.nombre })

        // Si es Admin o Gestor, crear cuenta de usuario
        if (t.rol !== "Trabajador") {
          await setDoc(doc(db, 'usuarios', docRef.id), {
            email: t.correo,
            password: "1234",
            nombre: t.nombre,
            role: t.rol
          })
        }
      }
      setProgress(40)

      // 3. Crear 100 Artículos
      setStatus("Generando 100 artículos de inventario...")
      const artIds: {id: string, nombre: string, stock: number, unidad: string}[] = []
      for (let i = 1; i <= 100; i++) {
        const catName = CATEGORIAS_SEED[Math.floor(Math.random() * CATEGORIAS_SEED.length)]
        const unidad = ["unidades", "metros", "kilogramos"][Math.floor(Math.random() * 3)]
        const stockInicial = Math.floor(Math.random() * 50) + 10
        const nombre = `${catName.split(' ')[0]} Especial Mod. ${i + 100}`
        
        const docRef = await addDoc(collection(db, 'articulos'), {
          codigo: `ART-${1000 + i}`,
          nombre: nombre,
          categoria: catName,
          descripcion: `Descripción técnica para ${nombre}. Material de alta calidad para uso industrial.`,
          unidad: unidad,
          stockActual: stockInicial,
          stockMinimo: 5,
          createdAt: serverTimestamp()
        })
        artIds.push({ id: docRef.id, nombre, stock: stockInicial, unidad })
        
        if (i % 10 === 0) setProgress(40 + (i / 2)) // Progreso gradual
      }
      setProgress(90)

      // 4. Crear 50 Movimientos
      setStatus("Generando historial de 50 movimientos...")
      for (let i = 0; i < 50; i++) {
        const articulo = artIds[Math.floor(Math.random() * artIds.length)]
        const trabajador = trabIds[Math.floor(Math.random() * trabIds.length)]
        const tipo = Math.random() > 0.3 ? 'salida' : 'entrada'
        const cantidad = Math.floor(Math.random() * 5) + 1
        
        await addDoc(collection(db, 'movimientosStock'), {
          articuloId: articulo.id,
          articuloNombre: articulo.nombre,
          trabajadorId: trabajador.id,
          trabajadorNombre: trabajador.nombre,
          tipo: tipo,
          cantidad: cantidad,
          fecha: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
          notas: `Movimiento de prueba generado automáticamente #${i+1}`,
          createdAt: serverTimestamp()
        })
      }

      setProgress(100)
      setStatus("¡Base de datos poblada con éxito!")
      toast({ title: "Datos generados", description: "El sistema ya cuenta con información de prueba." })
      await wait(1500)
      router.push('/dashboard')
      
    } catch (error) {
      console.error(error)
      toast({ title: "Error en Seeding", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-in fade-in duration-700">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
      </Button>

      <div className="text-center space-y-4">
        <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary">
          <Database className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-primary">Generador de Datos</h1>
        <p className="text-muted-foreground font-medium">Esta utilidad llenará tu base de datos con información realista para pruebas.</p>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <AlertTriangle className="text-amber-500 h-5 w-5" /> Advertencia
          </CardTitle>
          <CardDescription className="font-bold">
            Se añadirán 10 categorías, 10 trabajadores, 100 artículos y 50 movimientos. No se borrarán los datos actuales.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-8">
          {loading ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest text-primary">
                <span>{status}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 rounded-full" />
              <div className="flex items-center justify-center gap-3 text-muted-foreground animate-pulse font-bold">
                <Loader2 className="h-5 w-5 animate-spin" />
                Sincronizando con Firestore...
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-primary">100</span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Artículos</span>
                </div>
                <div className="p-4 bg-muted/30 rounded-2xl text-center">
                  <span className="block text-2xl font-black text-accent">50</span>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Movimientos</span>
                </div>
              </div>
              <Button onClick={handleSeed} className="w-full h-16 rounded-2xl bg-primary text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                Comenzar Generación
              </Button>
            </div>
          )}

          {progress === 100 && (
            <div className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-2xl font-bold animate-in zoom-in">
              <CheckCircle2 className="h-6 w-6" />
              <span>¡Proceso completado! Redirigiendo...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
