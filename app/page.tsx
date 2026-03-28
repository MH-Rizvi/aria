import { redirect } from "next/navigation";
import { getServerSession } from "@/app/api/auth/[...nextauth]/route";
import ChatLayout from "@/components/ChatLayout";

export default async function HomePage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <ChatLayout />;
}
