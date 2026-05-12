"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Component that redirects to the home page on initial load or refresh,
 * as per user requirement: "toda vez que for abrir e atualizar deverá iniciar na pagina inicial"
 */
export default function HomeRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if we are already at home
    if (pathname !== "/") {
      console.log("Redirecting to home on refresh/initial load...");
      router.replace("/");
    }
  }, []); // Run only once on mount

  return null;
}
