import { createContext, useContext } from "react";

const roles = ["ADMIN", "GERENTE", "VENDEDOR", "MECÂNICO", "CLIENTE"] as const;
export type Role = (typeof roles)[number];
export { roles };

const RoleContext = createContext<Role>("ADMIN");

export const RoleProvider = RoleContext.Provider;
export const useRole = () => useContext(RoleContext);
