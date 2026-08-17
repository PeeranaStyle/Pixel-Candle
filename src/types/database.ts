export type CandleType = "small" | "medium" | "large";

export type SessionStatus = "active" | "completed" | "abandoned";

export type PresenceSession = {
  sessionId: string;
  candleType: CandleType;
  startedAt: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; created_at: string };
        Insert: { id?: string; created_at?: string };
        Update: { id?: string; created_at?: string };
        Relationships: [];
      };
      candle_sessions: {
        Row: {
          id: string;
          user_id: string;
          candle_type: CandleType;
          started_at: string;
          completed_at: string | null;
          status: SessionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          candle_type: CandleType;
          started_at?: string;
          completed_at?: string | null;
          status?: SessionStatus;
          created_at?: string;
        };
        Update: {
          candle_type?: CandleType;
          completed_at?: string | null;
          status?: SessionStatus;
        };
        Relationships: [];
      };
      feedback: {
        Row: { id: string; user_id: string; message: string; created_at: string };
        Insert: { id?: string; user_id: string; message: string; created_at?: string };
        Update: { message?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
