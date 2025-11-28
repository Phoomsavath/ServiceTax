// app/api/warehouses/route.ts
import { messageTranslation } from "@/lib/constant";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/requirePermission";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuth();

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

    const invoiceNo = searchParams.get("invoiceNo");
    const type = searchParams.get("type");
    const companyId = searchParams.get("companyId")
      ? parseInt(searchParams.get("companyId")!)
      : undefined;

    // Build where clause
    const where: any = {};
    if (type) where.type = type;
    if (invoiceNo) where.invoiceNo = { contains: invoiceNo };
    if (companyId) where.companyId = companyId;

    // Pagination mode
    if (page && limit) {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.receiptService.findMany({
          skip,
          take: limit,
          where,
          orderBy: { createdAt: "desc" },

          select: {
            id: true,
            subBills: { select: { id: true, invoiceNo: true } },
            company: { select: { name: true } },
            bill: { select: { id: true, invoiceNo: true } },
            invoiceNo: true,
            totalAmount: true,
            createdAt: true,
            type: true,
            updatedAt: true,
            createdBy: { select: { fullName: true } },
            updatedBy: { select: { fullName: true } },
          },
        }),

        prisma.receiptService.count({ where }),
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
    const data = await prisma.receiptService.findMany({
      where,
      select: {
        id: true,
        type: true,
        invoiceNo: true,
        totalAmount: true,
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
