// app/api/dashboard/monthly-finance/route.ts
import { messageTranslation } from "@/lib/constant";
import prisma from "@/lib/prisma";
import { getAuth } from "@/lib/requirePermission";
import { PaidType, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

interface MonthlyFinance {
  year: number;
  month: number;
  totalCost: number;
  totalIncome: number;
  netProfit: number;
  invoiceCount: number;
  totalUnpaid: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuth();

    if (!session) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startYear = searchParams.get("startYear")
      ? parseInt(searchParams.get("startYear")!)
      : undefined;
    const startMonth = searchParams.get("startMonth")
      ? parseInt(searchParams.get("startMonth")!)
      : undefined;
    const endYear = searchParams.get("endYear")
      ? parseInt(searchParams.get("endYear")!)
      : undefined;
    const endMonth = searchParams.get("endMonth")
      ? parseInt(searchParams.get("endMonth")!)
      : undefined;
    const companyId = searchParams.get("companyId")
      ? parseInt(searchParams.get("companyId")!)
      : undefined;

    // Build where clause
    const whereClause: any = {
      type: { not: "QUOTATION" }, // Exclude quotations from financial reports
    };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    // Add date range filters
    const dateFilters: any[] = [];

    if (startYear && startMonth) {
      dateFilters.push({
        OR: [
          { year: { gt: startYear } },
          { year: startYear, month: { gte: startMonth } },
        ],
      });
    }

    if (endYear && endMonth) {
      dateFilters.push({
        OR: [
          { year: { lt: endYear } },
          { year: endYear, month: { lte: endMonth } },
        ],
      });
    }

    if (dateFilters.length > 0) {
      whereClause.AND = dateFilters;
    }

    // Fetch invoices with their services
    const invoices = await prisma.saleInvoice.findMany({
      where: whereClause,
      include: {
        saleInvoiceServices: true,
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    // Group by year and month
    const monthlyDataMap = new Map<string, MonthlyFinance>();

    invoices.forEach((invoice) => {
      const key = `${invoice.year}-${invoice.month}`;

      if (!monthlyDataMap.has(key)) {
        monthlyDataMap.set(key, {
          year: invoice.year,
          month: invoice.month,
          totalCost: 0,
          totalIncome: 0,
          netProfit: 0,
          invoiceCount: 0,
          totalUnpaid: 0,
        });
      }

      const monthData = monthlyDataMap.get(key)!;
      monthData.invoiceCount++;

      // Calculate cost and income from services
      invoice.saleInvoiceServices.forEach((service) => {
        const cost = parseFloat(service.cost.toString()) * service.quantity;
        const income = parseFloat(service.price.toString()) * service.quantity;

        monthData.totalCost += cost;
        monthData.totalIncome += income;
      });

      // Add to unpaid total if invoice is not fully paid
      if (invoice.paidStatus === PaidType.UNPAID) {
        monthData.totalUnpaid += parseFloat(invoice.totalAmount.toString());
      }
    });

    // Convert to array and calculate net profit
    const monthlyData: MonthlyFinance[] = Array.from(
      monthlyDataMap.values()
    ).map((data) => ({
      ...data,
      netProfit: data.totalIncome - data.totalCost,
      totalCost: Math.round(data.totalCost * 100) / 100,
      totalIncome: Math.round(data.totalIncome * 100) / 100,
      totalUnpaid: Math.round(data.totalUnpaid * 100) / 100,
    }));

    // Sort by year and month descending
    monthlyData.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Calculate summary totals
    const summary = monthlyData.reduce(
      (acc, curr) => ({
        totalCost: acc.totalCost + curr.totalCost,
        totalIncome: acc.totalIncome + curr.totalIncome,
        netProfit: acc.netProfit + curr.netProfit,
        totalUnpaid: acc.totalUnpaid + curr.totalUnpaid,
      }),
      { totalCost: 0, totalIncome: 0, netProfit: 0, totalUnpaid: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        monthly: monthlyData,
        summary: {
          totalCost: Math.round(summary.totalCost * 100) / 100,
          totalIncome: Math.round(summary.totalIncome * 100) / 100,
          netProfit: Math.round(summary.netProfit * 100) / 100,
          totalUnpaid: Math.round(summary.totalUnpaid * 100) / 100,
          totalInvoices: invoices.length,
          monthCount: monthlyData.length,
        },
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
