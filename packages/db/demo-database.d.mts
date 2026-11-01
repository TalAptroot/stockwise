export function demoDatabaseFile(): string;
export function demoDatabaseUrl(): string;
export function isSqliteDatabaseUrl(
  connectionString: string | undefined,
): connectionString is string;
export function toSqliteAdapterUrl(connectionString: string): string;
