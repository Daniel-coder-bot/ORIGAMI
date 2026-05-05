'use server';
/**
 * @fileOverview Un agente de IA para generar descripciones de artículos de inventario.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerarDescripcionArticuloInventarioInputSchema = z.object({
  nombreArticulo: z
    .string()
    .describe('El nombre del artículo de inventario para el que se generará una descripción.'),
  categoriaArticulo: z
    .string()
    .optional()
    .describe('La categoría del artículo de inventario (opcional, para mayor contexto).'),
});

export type GenerarDescripcionArticuloInventarioInput = z.infer<
  typeof GenerarDescripcionArticuloInventarioInputSchema
>;

const GenerarDescripcionArticuloInventarioOutputSchema = z.object({
  descripcionGenerada: z.string().describe('La descripción concisa y relevante generada por la IA.'),
});

export type GenerarDescripcionArticuloInventarioOutput = z.infer<
  typeof GenerarDescripcionArticuloInventarioOutputSchema
>;

export async function generarDescripcionArticuloInventario(
  input: GenerarDescripcionArticuloInventarioInput
): Promise<GenerarDescripcionArticuloInventarioOutput> {
  return generarDescripcionArticuloInventarioFlow(input);
}

const promptGenerarDescripcionArticulo = ai.definePrompt({
  name: 'promptGenerarDescripcionArticulo',
  input: {schema: GenerarDescripcionArticuloInventarioInputSchema},
  output: {schema: GenerarDescripcionArticuloInventarioOutputSchema},
  prompt: `Eres un asistente de IA experto en la gestión de inventarios. Tu tarea es generar una descripción corta, concisa y relevante para un artículo de inventario. La descripción debe capturar los aspectos clave del artículo, facilitando su identificación y gestión.

Información del artículo:
Nombre del artículo: {{{nombreArticulo}}}
{{#if categoriaArticulo}}
Categoría del artículo: {{{categoriaArticulo}}}
{{/if}}

Por favor, genera una descripción adecuada en español.`,
});

const generarDescripcionArticuloInventarioFlow = ai.defineFlow(
  {
    name: 'generarDescripcionArticuloInventarioFlow',
    inputSchema: GenerarDescripcionArticuloInventarioInputSchema,
    outputSchema: GenerarDescripcionArticuloInventarioOutputSchema,
  },
  async input => {
    const {output} = await promptGenerarDescripcionArticulo(input);
    if (!output) {
      throw new Error('No se pudo generar la descripción del artículo.');
    }
    return output;
  }
);