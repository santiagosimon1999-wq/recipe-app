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
      profiles: {
        Row: {
          id: string
          display_name: string | null
          username: string | null
          avatar_url: string | null
          bio: string | null
          deleted_at: string | null
        }
        Insert: {
          id: string
          display_name?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          display_name?: string | null
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
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
          is_public: boolean
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
          is_public?: boolean
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
          is_public?: boolean
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
      saved_recipes: {
        Row: {
          id: number
          recipe_id: number
          user_id: string
          created_at: string | null
        }
        Insert: {
          id?: never
          recipe_id: number
          user_id: string
          created_at?: string | null
        }
        Update: {
          id?: never
          recipe_id?: number
          user_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'saved_recipes_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'saved_recipes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      recipe_likes: {
        Row: {
          id: number
          recipe_id: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: never
          recipe_id: number
          user_id: string
          created_at?: string
        }
        Update: {
          id?: never
          recipe_id?: number
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_likes_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      recipe_like_counts: {
        Row: {
          recipe_id: number
          like_count: number
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_likes_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Functions: {
      delete_user_account: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
