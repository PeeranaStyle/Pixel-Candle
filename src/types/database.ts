export type CandleType = "small" | "medium" | "large";

export type SessionStatus = "active" | "completed" | "abandoned";
export type RoomType = "shared" | "match";
export type RoomStatus = "waiting" | "active" | "completed" | "closed";
export type ChatMode = "limited" | "off";
export type RoomMemberStatus = "joined" | "ready" | "studying" | "completed" | "left";
export type MatchStatus =
  | "searching"
  | "matched"
  | "waiting_ready"
  | "countdown"
  | "studying"
  | "completed"
  | "cancelled";

export type PresenceSession = {
  sessionId: string;
  userId?: string;
  candleType: CandleType;
  startedAt: number;
  duration?: number;
  status?: RoomMemberStatus | SessionStatus;
  displayName?: string;
  avatarId?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name?: string;
          avatar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      candle_sessions: {
        Row: {
          id: string;
          user_id: string;
          candle_type: CandleType;
          started_at: string;
          duration_ms: number;
          completed_at: string | null;
          status: SessionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          candle_type: CandleType;
          started_at?: string;
          duration_ms?: number;
          completed_at?: string | null;
          status?: SessionStatus;
          created_at?: string;
        };
        Update: {
          candle_type?: CandleType;
          duration_ms?: number;
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
      study_rooms: {
        Row: {
          id: string;
          type: RoomType;
          status: RoomStatus;
          max_members: number;
          chat_mode: ChatMode;
          created_by: string;
          created_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          type: RoomType;
          status?: RoomStatus;
          max_members?: number;
          chat_mode?: ChatMode;
          created_by: string;
          created_at?: string;
          ended_at?: string | null;
        };
        Update: {
          status?: RoomStatus;
          max_members?: number;
          chat_mode?: ChatMode;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      room_members: {
        Row: {
          room_id: string;
          user_id: string;
          session_id: string | null;
          status: RoomMemberStatus;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          room_id: string;
          user_id: string;
          session_id?: string | null;
          status?: RoomMemberStatus;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          session_id?: string | null;
          status?: RoomMemberStatus;
          left_at?: string | null;
        };
        Relationships: [];
      };
      room_messages: {
        Row: { id: string; room_id: string; user_id: string; message: string; created_at: string };
        Insert: { id?: string; room_id: string; user_id: string; message: string; created_at?: string };
        Update: { message?: string };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          room_id: string;
          user_a: string;
          user_b: string | null;
          duration_ms: number;
          status: MatchStatus;
          created_at: string;
          started_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_a: string;
          user_b?: string | null;
          duration_ms: number;
          status?: MatchStatus;
          created_at?: string;
          started_at?: string | null;
        };
        Update: {
          user_b?: string | null;
          status?: MatchStatus;
          started_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      send_room_message: {
        Args: { p_room_id: string; p_message: string };
        Returns: Database["public"]["Tables"]["room_messages"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
