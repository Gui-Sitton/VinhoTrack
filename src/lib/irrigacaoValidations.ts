import { z } from 'zod';

/**
 * Validation schema for irrigation records.
 */
export const irrigacaoSchema = z.object({
  talhao_id: z.string().uuid({ message: 'ID do talhão inválido' }),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data de início inválida (formato esperado: AAAA-MM-DD)' }),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data de fim inválida (formato esperado: AAAA-MM-DD)' }).optional().nullable(),
  volume_total_l: z.number().min(0.01, { message: 'Volume total deve ser maior que zero' }).max(1000000, { message: 'Volume total deve ser no máximo 1.000.000 L' }),
  volume_por_muda_l: z.number().min(0, { message: 'Volume por muda não pode ser negativo' }).max(10000, { message: 'Volume por muda deve ser no máximo 10.000 L' }).optional().nullable(),
  observacoes: z.string().max(2000, { message: 'Observações devem ter no máximo 2000 caracteres' }).optional().nullable(),
}).refine((data) => {
  // Se data_fim existir, deve ser >= data_inicio
  if (data.data_fim) {
    return new Date(data.data_fim) >= new Date(data.data_inicio);
  }
  return true;
}, {
  message: 'Data de fim não pode ser anterior à data de início',
  path: ['data_fim'],
});

export type IrrigacaoFormInput = z.infer<typeof irrigacaoSchema>;
