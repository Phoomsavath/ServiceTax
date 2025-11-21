// app/api/warehouses/route.ts
import { messageTranslation } from "@/lib/constant";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/requirePermission";
import { ActiveState, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuth();

    if (!session) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (session.user.role !== Role.ADMIN)
      NextResponse.redirect(new URL("/unauthorized", request.url));

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : undefined;
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!)
      : undefined;

    // Build where clause
    const where: any = {};

    // Pagination mode

    // Fetch all mode
    const data = await prisma.company.findMany({
      where: { ...where, activeStatus: ActiveState.ACTIVE },
    });

    const total = data.length;

    return NextResponse.json({
      success: true,
      data: data,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: total,
        hasNext: false,
        hasPrev: false,
      },
    });
  } catch (error: any) {
    if (
      error.message?.includes(messageTranslation.Forbidden) ||
      error.message?.includes(messageTranslation.Unauthorized)
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.json(
      {
        success: false,
        error: messageTranslation.Unknown,
      },
      { status: 500 }
    );
  }
}
