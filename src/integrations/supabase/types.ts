export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aplicacoes_produtos: {
        Row: {
          created_at: string | null
          data: string
          id: string
          motivo: string | null
          produto_id: string | null
          quantidade: number
          talhao_id: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: string
          motivo?: string | null
          produto_id?: string | null
          quantidade: number
          talhao_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          motivo?: string | null
          produto_id?: string | null
          quantidade?: number
          talhao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aplicacoes_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aplicacoes_produtos_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      fases_fenologicas_mudas: {
        Row: {
          altura_media_cm: number | null
          BBCH_aproximado: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string
          descricao_cientifica: string | null
          fase: string
          fase_cientifica: string | null
          id: string
          muda_id: string
        }
        Insert: {
          altura_media_cm?: number | null
          BBCH_aproximado?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao_cientifica?: string | null
          fase: string
          fase_cientifica?: string | null
          id?: string
          muda_id: string
        }
        Update: {
          altura_media_cm?: number | null
          BBCH_aproximado?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao_cientifica?: string | null
          fase?: string
          fase_cientifica?: string | null
          id?: string
          muda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fases_fenologicas_mudas_muda_id_fkey"
            columns: ["muda_id"]
            isOneToOne: false
            referencedRelation: "mudas"
            referencedColumns: ["id"]
          },
        ]
      }
      irrigacoes_talhoes: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          observacoes: string | null
          talhao_id: string
          user_id: string
          volume_por_muda_l: number | null
          volume_total_l: number
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          id?: string
          observacoes?: string | null
          talhao_id: string
          user_id: string
          volume_por_muda_l?: number | null
          volume_total_l: number
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          observacoes?: string | null
          talhao_id?: string
          user_id?: string
          volume_por_muda_l?: number | null
          volume_total_l?: number
        }
        Relationships: [
          {
            foreignKeyName: "irrigacoes_talhoes_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      mudas: {
        Row: {
          codigo: string
          created_at: string | null
          data_plantio: string | null
          id: string
          latitude: number | null
          linha: number
          longitude: number | null
          planta_na_linha: number
          status: Database["public"]["Enums"]["muda_status"] | null
          talhao_id: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          data_plantio?: string | null
          id?: string
          latitude?: number | null
          linha: number
          longitude?: number | null
          planta_na_linha: number
          status?: Database["public"]["Enums"]["muda_status"] | null
          talhao_id?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          data_plantio?: string | null
          id?: string
          latitude?: number | null
          linha?: number
          longitude?: number | null
          planta_na_linha?: number
          status?: Database["public"]["Enums"]["muda_status"] | null
          talhao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mudas_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      observacoes_grupos: {
        Row: {
          created_at: string | null
          data: string
          id: string
          observacao: string
          talhao_id: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: string
          observacao: string
          talhao_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          observacao?: string
          talhao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observacoes_grupos_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      observacoes_grupos_mudas: {
        Row: {
          muda_id: string
          observacao_id: string
        }
        Insert: {
          muda_id: string
          observacao_id: string
        }
        Update: {
          muda_id?: string
          observacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "observacoes_grupos_mudas_muda_id_fkey"
            columns: ["muda_id"]
            isOneToOne: false
            referencedRelation: "mudas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observacoes_grupos_mudas_observacao_id_fkey"
            columns: ["observacao_id"]
            isOneToOne: false
            referencedRelation: "observacoes_grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      observacoes_mudas: {
        Row: {
          altura_cm: number | null
          created_at: string | null
          data: string
          fase_fenologica: string
          id: string
          muda_id: string | null
          observacoes: string | null
        }
        Insert: {
          altura_cm?: number | null
          created_at?: string | null
          data: string
          fase_fenologica: string
          id?: string
          muda_id?: string | null
          observacoes?: string | null
        }
        Update: {
          altura_cm?: number | null
          created_at?: string | null
          data?: string
          fase_fenologica?: string
          id?: string
          muda_id?: string | null
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observacoes_mudas_muda_id_fkey"
            columns: ["muda_id"]
            isOneToOne: false
            referencedRelation: "mudas"
            referencedColumns: ["id"]
          },
        ]
      }
      observacoes_talhoes: {
        Row: {
          created_at: string | null
          data: string
          id: string
          observacao: string
          origem: string | null
          talhao_id: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: string
          observacao: string
          origem?: string | null
          talhao_id: string
          tipo: string
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          observacao?: string
          origem?: string | null
          talhao_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "observacoes_talhoes_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      producao: {
        Row: {
          created_at: string | null
          id: string
          observacoes: string | null
          plantas_produtivas: number | null
          producao_total_kg: number
          safra_id: string | null
          talhao_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          observacoes?: string | null
          plantas_produtivas?: number | null
          producao_total_kg: number
          safra_id?: string | null
          talhao_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          observacoes?: string | null
          plantas_produtivas?: number | null
          producao_total_kg?: number
          safra_id?: string | null
          talhao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producao_safra_id_fkey"
            columns: ["safra_id"]
            isOneToOne: false
            referencedRelation: "safras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          created_at: string | null
          id: string
          ingrediente_ativo: string | null
          nome: string
          observacao: string | null
          tipo: Database["public"]["Enums"]["produto_tipo"]
          unidade: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingrediente_ativo?: string | null
          nome: string
          observacao?: string | null
          tipo: Database["public"]["Enums"]["produto_tipo"]
          unidade: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingrediente_ativo?: string | null
          nome?: string
          observacao?: string | null
          tipo?: Database["public"]["Enums"]["produto_tipo"]
          unidade?: string
        }
        Relationships: []
      }
      safras: {
        Row: {
          ano: number
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          talhao_id: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          talhao_id?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          talhao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safras_talhao_id_fkey"
            columns: ["talhao_id"]
            isOneToOne: false
            referencedRelation: "talhoes"
            referencedColumns: ["id"]
          },
        ]
      }
      talhoes: {
        Row: {
          area_ha: number | null
          codigo: string
          created_at: string | null
          data_plantio: string
          espacamento_linhas_m: number
          espacamento_plantas_m: number
          id: string
          nome: string | null
          orientacao_linhas: string | null
          porta_enxerto: string | null
          user_id: string | null
          variedade: string
        }
        Insert: {
          area_ha?: number | null
          codigo: string
          created_at?: string | null
          data_plantio: string
          espacamento_linhas_m: number
          espacamento_plantas_m: number
          id?: string
          nome?: string | null
          orientacao_linhas?: string | null
          porta_enxerto?: string | null
          user_id?: string | null
          variedade: string
        }
        Update: {
          area_ha?: number | null
          codigo?: string
          created_at?: string | null
          data_plantio?: string
          espacamento_linhas_m?: number
          espacamento_plantas_m?: number
          id?: string
          nome?: string | null
          orientacao_linhas?: string | null
          porta_enxerto?: string | null
          user_id?: string | null
          variedade?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_manejo_desenvolvimento_talhao: {
        Row: {
          altura_media_cm: number | null
          data_evento: string | null
          num_aplicacoes: number | null
          quantidade_total: number | null
          talhao_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      muda_status: "ativa" | "atencao" | "falha" | "substituida"
      produto_tipo:
        | "fungicida"
        | "fertilizante"
        | "corretivo"
        | "inseticida"
        | "outro"
        | "adjuvante"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      muda_status: ["ativa", "atencao", "falha", "substituida"],
      produto_tipo: [
        "fungicida",
        "fertilizante",
        "corretivo",
        "inseticida",
        "outro",
        "adjuvante",
      ],
    },
  },
} as const
