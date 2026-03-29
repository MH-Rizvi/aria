import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

interface AriaUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AriaStore {
  messages: Message[];
  conversationId: string | null;
  currentModelIndex: number;
  modelStatus: "healthy" | "rate-limited" | "exhausted";
  isLoading: boolean;
  user: AriaUser | null;
  gmailConnected: boolean;
  calendarConnected: boolean;

  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  setConversationId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentModelIndex: (index: number) => void;
  setModelStatus: (status: "healthy" | "rate-limited" | "exhausted") => void;
  setGmailConnected: (connected: boolean) => void;
  setCalendarConnected: (connected: boolean) => void;
  clearMessages: () => void;
}

export const useAriaStore = create<AriaStore>((set) => ({
  messages: [],
  conversationId: null,
  currentModelIndex: 0,
  modelStatus: "healthy",
  isLoading: false,
  user: null,
  gmailConnected: false,
  calendarConnected: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setMessages: (messages) =>
    set({ messages }),

  setConversationId: (id) =>
    set({ conversationId: id }),

  setIsLoading: (loading) =>
    set({ isLoading: loading }),

  setCurrentModelIndex: (index) =>
    set({ currentModelIndex: index }),

  setModelStatus: (status) =>
    set({ modelStatus: status }),

  setGmailConnected: (connected) =>
    set({ gmailConnected: connected }),

  setCalendarConnected: (connected) =>
    set({ calendarConnected: connected }),

  clearMessages: () =>
    set({ messages: [] }),
}));
