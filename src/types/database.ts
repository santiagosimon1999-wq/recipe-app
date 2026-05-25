export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: number
          user_id: string
          title: string
          description: string
          ingredients: string[]
          instructions: string
          category: string
          image_url: string | null
          calories: number
          protein: number
          carbs: number
          fat: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: never
          user_id: string
          title: string
          description?: string
          ingredients?: string[]
          instructions?: string
          category?: string
          image_url?: string | null
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: never
          user_id?: string
          title?: string
          description?: string
          ingredients?: string[]
          instructions?: string
          category?: string
          image_url?: string | null
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}