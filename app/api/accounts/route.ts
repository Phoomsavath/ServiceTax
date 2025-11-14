// app/api/accounts/route.ts

import { messageTranslation } from "@/lib/constant";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/requirePermission";
import { Permission, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Check access (ADMIN role and ACCOUNT_VIEW permission)
    const session = await requirePermission(Permission.USER_VIEW);

    if (!session) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page")
      ? parseInt(searchParams.get("page")!)
      : undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const userName = searchParams.get("userName");

    // Build where clause
    const where: any = {};

    if (userName) {
      where.userName = { contains: userName };
    }

    // Pagination mode
    if (page && limit) {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            userName: true,
            fullName: true,
            role: true,
            activeStatus: true,
          },
          skip: skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));
      const dataWithStt = data.map((item, index) => ({
        ...item,
        stt: skip + index + 1,
      }));

      return NextResponse.json({
        success: true,
        data: dataWithStt,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    }

    // Fetch all mode
    const data = await prisma.user.findMany({
      where,
      select: {
        id: true,
        userName: true,
        fullName: true,
        role: true,
      },
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
