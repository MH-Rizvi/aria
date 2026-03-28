import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import ChatLayout from "@/components/ChatLayout";

export default async function HomePage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <ChatLayout />;
}
