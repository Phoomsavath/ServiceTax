"use server";

import { messageTranslation } from "./constant";

export async function handleAction<T>(
  action: () => Promise<T>,
  messages?: { successKey?: string; errorKey?: string }
) {
  try {
    const result = await action();

    return {
      success: true,
      message: messages?.successKey,
      data: result,
    };
  } catch (err: any) {
    let message = err.message || messages?.errorKey;
    // Prisma duplicate error
    if (err.code === "P2002") {
      message = messageTranslation.DuplicatedDataUnique;
    }
    if (err.code === "P2025") message = err.message;

    return {
      success: false,
      message,
    };
  }
}
