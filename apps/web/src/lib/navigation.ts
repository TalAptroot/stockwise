export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "movements", label: "Movements" },
] as const;

export type AppView = (typeof NAV_ITEMS)[number]["id"];
