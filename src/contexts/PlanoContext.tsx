import { createContext, useContext } from "react";

export type Plano = "starter" | "professional" | "enterprise" | "platina" | "trial";

export const planos: Plano[] = ["starter", "professional", "enterprise", "platina"];

export const planoLabels: Record<Plano, string> = {
  starter: "Bronze",
  professional: "Prata",
  enterprise: "Ouro",
  platina: "Platina",
  trial: "Trial",
};

const PlanoContext = createContext<Plano>("platina");

export const PlanoProvider = PlanoContext.Provider;
export const usePlano = () => useContext(PlanoContext);
