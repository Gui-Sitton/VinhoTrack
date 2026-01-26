import { z } from 'zod';

/**
 * Validation schema for creating a new observation (observação)
 */
export const observacaoSchema = z.object({
  muda_id: z.string().uuid({ message: 'ID da muda inválido' }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida (formato esperado: AAAA-MM-DD)' }),
  fase_fenologica: z.string().min(1, { message: 'Fase fenológica é obrigatória' }).max(100, { message: 'Fase fenológica deve ter no máximo 100 caracteres' }),
  altura_cm: z.number().min(0, { message: 'Altura não pode ser negativa' }).max(1000, { message: 'Altura deve ser no máximo 1000 cm' }).nullable(),
  observacoes: z.string().max(2000, { message: 'Observações devem ter no máximo 2000 caracteres' }).nullable(),
});

export type ObservacaoInput = z.infer<typeof observacaoSchema>;

/**
 * Validation schema for creating a new product application (aplicação de produto)
 */
export const aplicacaoSchema = z.object({
  produto_id: z.string().uuid({ message: 'ID do produto inválido' }),
  talhao_id: z.string().uuid({ message: 'ID do talhão inválido' }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida (formato esperado: AAAA-MM-DD)' }),
  quantidade: z.number().min(0.01, { message: 'Quantidade deve ser maior que zero' }).max(100000, { message: 'Quantidade deve ser no máximo 100.000' }),
  motivo: z.string().max(1000, { message: 'Motivo deve ter no máximo 1000 caracteres' }).optional(),
});

export type AplicacaoInput = z.infer<typeof aplicacaoSchema>;
