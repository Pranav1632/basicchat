export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
}
