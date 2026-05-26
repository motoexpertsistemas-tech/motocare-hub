import { ReactNode, useMemo } from "react";
import { detectSubdomain } from "@/lib/subdomainDetector";
import Ecommerce from "@/pages/Ecommerce";
import { EcommerceAuthProvider } from "@/contexts/EcommerceAuthContext";

interface SubdomainRouterProps {
  children: ReactNode;
}

export function SubdomainRouter({ children }: SubdomainRouterProps) {
  const slug = useMemo(() => detectSubdomain(window.location.hostname), []);

  if (slug) {
    return (
      <EcommerceAuthProvider>
        <Ecommerce slugOverride={slug} />
      </EcommerceAuthProvider>
    );
  }

  return <>{children}</>;
}
