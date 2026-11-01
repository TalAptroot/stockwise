const PRISMA_CODE = /^P\d{4}$/;

export type DbErrorInfo = {
  prismaCode?: string;
  errno?: number;
};

export function inspectDbError(error: unknown): DbErrorInfo {
  const info: DbErrorInfo = {};
  let current: unknown = error;

  for (let depth = 0; depth < 6; depth += 1) {
    if (typeof current !== "object" || current === null) {
      break;
    }

    if (info.prismaCode === undefined && "code" in current && typeof current.code === "string") {
      if (PRISMA_CODE.test(current.code)) {
        info.prismaCode = current.code;
      }
    }

    if (info.errno === undefined && "errno" in current && typeof current.errno === "number") {
      info.errno = current.errno;
    }

    if (
      info.errno === undefined &&
      "code" in current &&
      typeof current.code === "number" &&
      Number.isInteger(current.code)
    ) {
      info.errno = current.code;
    }

    if (!("cause" in current)) {
      break;
    }
    current = current.cause;
  }

  return info;
}
