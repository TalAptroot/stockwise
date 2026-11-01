export const SERVICE_NAME = "stockwise";

export type HealthStatus = {
  service: typeof SERVICE_NAME;
  status: "ok";
};
