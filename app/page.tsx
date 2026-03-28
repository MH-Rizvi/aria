import { getServerSession, signIn, signOut } from "@/app/api/auth/[...nextauth]/route";

export default async function HomePage() {
  const session = await getServerSession();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Aria AI Sign In Test</h1>
      
      {session?.user ? (
        <div className="flex flex-col items-center gap-4">
          <p>Signed in as <strong>{session.user.name || session.user.email}</strong></p>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </form>
        </div>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign In with Google
          </button>
        </form>
      )}
    </main>
  );
}
