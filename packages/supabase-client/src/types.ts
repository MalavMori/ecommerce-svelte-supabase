export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          is_default: boolean | null
          label: string | null
          line1: string
          line2: string | null
          postal_code: string
          state: string | null
          user_id: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          line1: string
          line2?: string | null
          postal_code: string
          state?: string | null
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          line1?: string
          line2?: string | null
          postal_code?: string
          state?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          position: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          position?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          position?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          decimal_digits: number
          is_active: boolean | null
          name: string
          symbol: string
        }
        Insert: {
          code: string
          decimal_digits?: number
          is_active?: boolean | null
          name: string
          symbol: string
        }
        Update: {
          code?: string
          decimal_digits?: number
          is_active?: boolean | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          currency_code: string
          rate_to_base: number
          updated_at: string | null
        }
        Insert: {
          currency_code: string
          rate_to_base: number
          updated_at?: string | null
        }
        Update: {
          currency_code?: string
          rate_to_base?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: true
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      featured_collections: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          label: string | null
          position: number
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string | null
          position?: number
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          label?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "featured_collections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_products: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          position: number
          product_id: string
          section: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          position?: number
          product_id: string
          section?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          position?: number
          product_id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_id: string | null
          variant_label: string | null
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          order_id: string
          status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          order_id: string
          status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          coupon_id: string | null
          created_at: string | null
          discount_amount: number | null
          display_currency_code: string | null
          display_total: number | null
          id: string
          payment_status: string | null
          shipping_amount: number | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          address_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          display_currency_code?: string | null
          display_total?: number | null
          id?: string
          payment_status?: string | null
          shipping_amount?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal: number
          total: number
          user_id?: string | null
        }
        Update: {
          address_id?: string | null
          coupon_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          display_currency_code?: string | null
          display_total?: number | null
          id?: string
          payment_status?: string | null
          shipping_amount?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_display_currency_code_fkey"
            columns: ["display_currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          position: number | null
          product_id: string
          url: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          position?: number | null
          product_id: string
          url: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          position?: number | null
          product_id?: string
          url?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          position: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          position?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          position?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string | null
          id: string
          name: string
          position: number | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          price: number
          product_id: string
          sale_ends_at: string | null
          sale_price: number | null
          sale_starts_at: string | null
          sku: string | null
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price: number
          product_id: string
          sale_ends_at?: string | null
          sale_price?: number | null
          sale_starts_at?: string | null
          sku?: string | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          price?: number
          product_id?: string
          sale_ends_at?: string | null
          sale_price?: number | null
          sale_starts_at?: string | null
          sku?: string | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          compare_at_price: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          og_image_url: string | null
          price: number
          sku: string | null
          slug: string
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          og_image_url?: string | null
          price: number
          sku?: string | null
          slug: string
          stock_quantity?: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          og_image_url?: string | null
          price?: number
          sku?: string | null
          slug?: string
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          id: string
          order_id: string
          reason: string
          refund_amount: number | null
          requested_at: string | null
          resolved_at: string | null
          status: string
          stripe_refund_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          order_id: string
          reason: string
          refund_amount?: number | null
          requested_at?: string | null
          resolved_at?: string | null
          status?: string
          stripe_refund_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          reason?: string
          refund_amount?: number | null
          requested_at?: string | null
          resolved_at?: string | null
          status?: string
          stripe_refund_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_images: {
        Row: {
          created_at: string | null
          id: string
          position: number | null
          review_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          position?: number | null
          review_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          position?: number | null
          review_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_verified_purchase: boolean
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string | null
          delivered_at: string | null
          estimated_delivery: string | null
          id: string
          order_id: string
          shipped_at: string | null
          status: string
          tracking_number: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          order_id: string
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          order_id?: string
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          base_currency_code: string
          id: boolean
        }
        Insert: {
          base_currency_code?: string
          id?: boolean
        }
        Update: {
          base_currency_code?: string
          id?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_base_currency_code_fkey"
            columns: ["base_currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      variant_option_values: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_option_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_price: {
        Args: { p_amount: number; p_target_currency: string }
        Returns: number
      }
      create_pending_checkout_order: {
        Args: {
          p_address_id: string
          p_coupon_code?: string
          p_display_currency?: string
          p_user_id: string
        }
        Returns: Json
      }
      decrement_stock: {
        Args: { p_quantity: number; p_variant_id: string }
        Returns: boolean
      }
      effective_price: { Args: { p_variant_id: string }; Returns: number }
      fulfill_paid_order: {
        Args: {
          p_customer_id?: string
          p_order_id: string
          p_payment_intent_id: string
        }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      redeem_coupon: { Args: { p_coupon_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const


// ============================================================
// Convenience row/insert/update aliases for app + agent use
// ============================================================
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Address = Database['public']['Tables']['addresses']['Row'];
export type AddressInsert = Database['public']['Tables']['addresses']['Insert'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type ProductImage = Database['public']['Tables']['product_images']['Row'];

export type CartItem = Database['public']['Tables']['cart_items']['Row'];
export type CartItemInsert = Database['public']['Tables']['cart_items']['Insert'];

export type Coupon = Database['public']['Tables']['coupons']['Row'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];

export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert'];

// Variant tables
export type ProductOption = Database['public']['Tables']['product_options']['Row'];
export type ProductOptionInsert = Database['public']['Tables']['product_options']['Insert'];
export type ProductOptionValue = Database['public']['Tables']['product_option_values']['Row'];
export type ProductOptionValueInsert = Database['public']['Tables']['product_option_values']['Insert'];
export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
export type ProductVariantInsert = Database['public']['Tables']['product_variants']['Insert'];
export type ProductVariantUpdate = Database['public']['Tables']['product_variants']['Update'];
export type VariantOptionValue = Database['public']['Tables']['variant_option_values']['Row'];
export type VariantOptionValueInsert = Database['public']['Tables']['variant_option_values']['Insert'];

// Currency tables
export type Currency = Database['public']['Tables']['currencies']['Row'];
export type StoreSetting = Database['public']['Tables']['store_settings']['Row'];
export type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row'];

// Advanced ecommerce tables
export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type WishlistInsert = Database['public']['Tables']['wishlists']['Insert'];
export type OrderStatusHistory = Database['public']['Tables']['order_status_history']['Row'];
export type OrderStatusHistoryInsert = Database['public']['Tables']['order_status_history']['Insert'];
export type Shipment = Database['public']['Tables']['shipments']['Row'];
export type ShipmentInsert = Database['public']['Tables']['shipments']['Insert'];
export type Return = Database['public']['Tables']['returns']['Row'];
export type ReturnInsert = Database['public']['Tables']['returns']['Insert'];
export type ReviewImage = Database['public']['Tables']['review_images']['Row'];
export type ReviewImageInsert = Database['public']['Tables']['review_images']['Insert'];
export type Banner = Database['public']['Tables']['banners']['Row'];
export type BannerInsert = Database['public']['Tables']['banners']['Insert'];
export type FeaturedCollection = Database['public']['Tables']['featured_collections']['Row'];
export type FeaturedCollectionInsert = Database['public']['Tables']['featured_collections']['Insert'];
export type FeaturedProduct = Database['public']['Tables']['featured_products']['Row'];
export type FeaturedProductInsert = Database['public']['Tables']['featured_products']['Insert'];
export type Page = Database['public']['Tables']['pages']['Row'];
export type PageInsert = Database['public']['Tables']['pages']['Insert'];
