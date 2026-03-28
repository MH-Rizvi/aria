import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface AriaUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AriaStore {
  messages: Message[];
  currentModelIndex: number;
  isLoading: boolean;
  user: AriaUser | null;
  gmailConnected: boolean;
  calendarConnected: boolean;

  addMessage: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentModelIndex: (index: number) => void;
  setGmailConnected: (connected: boolean) => void;
  setCalendarConnected: (connected: boolean) => void;
  clearMessages: () => void;
}

export const useAriaStore = create<AriaStore>((set) => ({
  messages: [],
  currentModelIndex: 0,
  isLoading: false,
  user: null,
  gmailConnected: false,
  calendarConnected: false,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setIsLoading: (loading) =>
    set({ isLoading: loading }),

  setCurrentModelIndex: (index) =>
    set({ currentModelIndex: index }),

  setGmailConnected: (connected) =>
    set({ gmailConnected: connected }),

  setCalendarConnected: (connected) =>
    set({ calendarConnected: connected }),

  clearMessages: () =>
    set({ messages: [] }),
}));
