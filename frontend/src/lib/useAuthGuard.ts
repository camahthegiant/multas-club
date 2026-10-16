"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard(): boolean {
  const router = useRouter();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("multas_token")) {
      router.replace("/admin/login");
      return;
    }
    setListo(true);
  }, [router]);

  return listo;
}
