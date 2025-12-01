// app/api/employees/[id]/route.ts
import { messageTranslation } from "@/lib/constant";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/requirePermission";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permissions
    const session = await getAuth();

    if (!session) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Parse and validate ID
    const { id } = await params;

    const saleInvoiceId = Number(id);

    // Fetch employee
    const saleInvoice = await prisma.saleInvoice.findFirst({
      where: {
        id: saleInvoiceId,
      },
      select: {
        id: true,
        saleInvoiceNo: true,
        totalAmount: true,
        saleInvoiceServices: {
          select: {
            id: true,
            quantity: true,
            price: true,
            cost: true,
            details: true,
            service: {
              select: { name: true, group: true, unit: true },
            },
          },
        },
        createdAt: true,
        company: {
          select: { name: true, address: true, phone: true, taxNumber: true },
        },
      },
    });

    if (!saleInvoice) {
      return NextResponse.json(
        { success: false, error: messageTranslation.NotFound },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: saleInvoice,
    });
  } catch (error: any) {
    if (
      error.message?.includes(messageTranslation.Forbidden) ||
      error.message?.includes(messageTranslation.Unauthorized)
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    return NextResponse.json(
      { success: false, error: messageTranslation.Unknown },
      { status: 500 }
    );
  }
}
