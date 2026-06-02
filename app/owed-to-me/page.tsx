"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import DashboardNav from "@/components/DashboardNav";
import OwedToMeSection from "@/components/OwedToMeSection";

export default function OwedToMePage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Owed To Me</h1>
            <p className="text-muted-foreground mt-2">
              Track money that people owe you. Mark entries as paid when
              settled.
            </p>
          </div>

          <OwedToMeSection />
        </div>
      </main>
    </div>
  );
}
