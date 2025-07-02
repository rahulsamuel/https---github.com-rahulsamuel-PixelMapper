'use server';

/**
 * @fileOverview An AI agent that determines the closest raster screen match to the media server output.
 *
 * - generateRasterMap - A function that handles the raster map generation process.
 * - GenerateRasterMapInput - The input type for the generateRasterMap function.
 * - GenerateRasterMapOutput - The return type for the generateRasterMap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRasterMapInputSchema = z.object({
  tileWidth: z.number().describe('The width of the LED tile in pixels.'),
  tileHeight: z.number().describe('The height of the LED tile in pixels.'),
  screenWidthTiles: z.number().describe('The number of tiles in the screen width.'),
  screenHeightTiles: z.number().describe('The number of tiles in the screen height.'),
  outputResolution: z
    .enum(['HD', '4K', 'DCI'])
    .describe('The desired output resolution for the raster map (HD: 1920x1080, 4K: 3840x2160, DCI: 4096x2160).'),
});

export type GenerateRasterMapInput = z.infer<typeof GenerateRasterMapInputSchema>;

const GenerateRasterMapOutputSchema = z.object({
  rasterMapDescription: z
    .string()
    .describe('A description of the closest matching raster screen configuration.'),
});

export type GenerateRasterMapOutput = z.infer<typeof GenerateRasterMapOutputSchema>;

export async function generateRasterMap(input: GenerateRasterMapInput): Promise<GenerateRasterMapOutput> {
  return generateRasterMapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRasterMapPrompt',
  input: {schema: GenerateRasterMapInputSchema},
  output: {schema: GenerateRasterMapOutputSchema},
  prompt: `You are an expert in LED screen configurations and media server outputs.

  Based on the provided LED screen dimensions (tile width: {{{tileWidth}}} pixels, tile height: {{{tileHeight}}} pixels, screen width: {{{screenWidthTiles}}} tiles, screen height: {{{screenHeightTiles}}} tiles) and the desired output resolution ({{{outputResolution}}}), determine the closest matching raster screen configuration for media server output.

  Consider common raster screen configurations and provide a description of the recommended setup, including the number of raster tiles, their arrangement, and any relevant considerations for optimal media server performance.

  Ensure that the description includes specific instructions on how to configure the media server to achieve the best possible visual output for the given LED screen.
  The output resolution options are:
  - HD: 1920x1080
  - 4K: 3840x2160
  - DCI: 4096x2160`,
});

const generateRasterMapFlow = ai.defineFlow(
  {
    name: 'generateRasterMapFlow',
    inputSchema: GenerateRasterMapInputSchema,
    outputSchema: GenerateRasterMapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
