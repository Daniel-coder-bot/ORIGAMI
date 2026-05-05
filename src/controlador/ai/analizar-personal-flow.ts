'use server';
/**
 * @fileOverview Un agente de IA para analizar el desempeño y productividad del personal.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalizarPersonalInputSchema = z.object({
  estadisticas: z.array(z.object({
    nombre: z.string(),
    rol: z.string(),
    totalMovimientos: z.number().describe('Número total de operaciones realizadas.'),
    volumenTotal: z.number().describe('Suma total de unidades de material gestionadas.'),
    materialesDistintos: z.number().describe('Cantidad de tipos de materiales diferentes que ha manipulado.'),
  })).describe('Métricas de desempeño de los trabajadores basadas en movimientos reales.'),
});

export type AnalizarPersonalInput = z.infer<typeof AnalizarPersonalInputSchema>;

const AnalizarPersonalOutputSchema = z.object({
  analisis: z.string().describe('Análisis detallado sobre la productividad y eficiencia del equipo.'),
  recomendaciones: z.array(z.string()).describe('Acciones sugeridas para optimizar el flujo de trabajo.'),
  destacados: z.array(z.string()).describe('Identificación de trabajadores con desempeño excepcional.'),
});

export type AnalizarPersonalOutput = z.infer<typeof AnalizarPersonalOutputSchema>;

export async function analizarPersonal(input: AnalizarPersonalInput): Promise<AnalizarPersonalOutput> {
  return analizarPersonalFlow(input);
}

const promptAnalisisPersonal = ai.definePrompt({
  name: 'promptAnalisisPersonal',
  input: {schema: AnalizarPersonalInputSchema},
  output: {schema: AnalizarPersonalOutputSchema},
  prompt: `Eres un experto en Gestión de Almacenes y Optimización de Productividad. Analiza el desempeño del personal basándote en su actividad reciente:

Métricas de Desempeño:
{{#each estadisticas}}
- {{{nombre}}} ({{{rol}}}): {{{totalMovimientos}}} movimientos realizados, {{{volumenTotal}}} unidades totales gestionadas, ha manejado {{{materialesDistintos}}} tipos de materiales.
{{/each}}

Tu tarea es:
1. Evaluar quiénes son los trabajadores más productivos y por qué.
2. Detectar posibles cuellos de botella (por ejemplo, mucha carga concentrada en pocos trabajadores).
3. Identificar si hay trabajadores con poca actividad que podrían ser mejor aprovechados.
4. Generar 3 recomendaciones tácticas para mejorar la distribución de tareas.
5. Listar a los "Destacados" del mes basándose en volumen y frecuencia.

Por favor, genera la respuesta en español con un tono profesional, motivador y orientado a datos.`,
});

const analizarPersonalFlow = ai.defineFlow(
  {
    name: 'analizarPersonalFlow',
    inputSchema: AnalizarPersonalInputSchema,
    outputSchema: AnalizarPersonalOutputSchema,
  },
  async input => {
    const {output} = await promptAnalisisPersonal(input);
    if (!output) {
      throw new Error('No se pudo generar el análisis de desempeño del personal.');
    }
    return output;
  }
);