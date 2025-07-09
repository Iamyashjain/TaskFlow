import { useRouter } from "next/router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </main>
  );
}
