import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopBar } from "@/components/ui/TopBar";
import { WelcomeQuote } from "@/components/ui/WelcomeQuote";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const quote = (session.user as { quote?: string })?.quote;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {quote && <WelcomeQuote quote={quote} />}
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar session={session} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
