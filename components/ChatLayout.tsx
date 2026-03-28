"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";

export default function ChatLayout() {
  return (
    <div className="chat-layout">
      <Sidebar />
      <main className="chat-main">
        <ChatWindow />
      </main>
    </div>
  );
}
