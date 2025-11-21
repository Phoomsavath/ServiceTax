// app/api/warehouses/route.ts
import { messageTranslation } from "@/lib/constant";
import prisma from "@/lib/prisma";
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
    const billId = searchParams.get("billId");
    const companyId = searchParams.get("companyId")
      ? parseInt(searchParams.get("companyId")!)
      : undefined;
    // Build where clause
    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (type) where.type = type;
    if (invoiceNo) where.saleInvoiceNo = { contains: invoiceNo };

    if (billId) {
      if (billId === "unlinked") {
        where.billId = null;
      } else if (billId) {
        const id = parseInt(billId);
        if (!isNaN(id)) {
          where.OR = [{ billId: null }, { billId: id }];
        }
      }
    }

    // Pagination mode
    if (page && limit) {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        prisma.saleInvoice.findMany({
          skip,
          take: limit,
          where,
          select: {
            id: true,
            saleInvoiceNo: true,
            company: { select: { name: true } },
            totalAmount: true,
            createdAt: true,
            type: true,
            paidStatus: true,
            quotation: { select: { id: true, saleInvoiceNo: true } },
            subSaleInvoices: { select: { id: true, saleInvoiceNo: true } },
            createdBy: { select: { fullName: true } },
            updatedBy: { select: { fullName: true } },
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),

        prisma.saleInvoice.count({ where }),
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
    const data = await prisma.saleInvoice.findMany({
      where,
      select: {
        id: true,
        saleInvoiceNo: true,
        totalAmount: true,
      },
    });
    console.log(data);

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
