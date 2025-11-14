// app/api/accounts/[id]/route.ts
import { messageTranslation } from "@/lib/constant";
import prisma from "@/lib/prisma";
import { requireAccess } from "@/lib/requirePermission";
import { Permission, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check access (ADMIN role and ACCOUNT_VIEW permission)
    await requireAccess({
      roles: [Role.ADMIN],
      permissions: [Permission.USER_VIEW],
    });

    // Parse and validate ID
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: messageTranslation.NotFound },
        { status: 400 }
      );
    }

    // Fetch account
    const account = await prisma.user.findFirst({
      where: {
        id: Number(id),
      },
      select: {
        id: true,
        permissions: true,
        fullName: true,
        userName: true,
        role: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: messageTranslation.NotFound },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    if (
      error.message?.includes(messageTranslation.Unauthorized) ||
      error.message?.includes(messageTranslation.Forbidden)
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.json(
      { success: false, error: messageTranslation.Unknown },
      { status: 500 }
    );
  }
}
