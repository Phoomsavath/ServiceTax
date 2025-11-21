"use client";

import AuthButtons from "./AuthButtons";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BillType, InvoiceType, Role } from "@prisma/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { messageTranslation } from "@/lib/constant";

const COMMON_PUBLIC = [
  { title: messageTranslation.Home, href: "/" },
  { title: "about", href: "/about" },
];

const ROLE_MENUS = {
  ADMIN: [
    { title: messageTranslation.Account, href: "/accounts" },
    { title: messageTranslation.Company, href: "/companies" },
    {
      title: messageTranslation.SaleInvoice,
      children: [
        {
          title: messageTranslation.Invoice,
          href: `/invoices`,
        },
        {
          title: messageTranslation.Quotation,
          href: `/quotations`,
        },
      ],
    },
    {
      title: messageTranslation.Bill,
      children: [
        {
          title: messageTranslation.BillService,
          href: `/bill-services`,
        },
        {
          title: messageTranslation.ReceiptService,
          href: `/receipt-services`,
        },
      ],
    },
    { title: messageTranslation.Service, href: "/services" },
  ],
};

// Updated structure: single items or groups with children
type MenuItem = {
  title: string;
  href?: string;
  children?: { title: string; href: string }[];
};

const PERMISSION_MENUS: Record<string, MenuItem[]> = {
  COMPANY_VIEW: [{ title: messageTranslation.Company, href: "/companies" }],
  USER_VIEW: [{ title: messageTranslation.Account, href: "/accounts" }],
  BILL_VIEW: [
    {
      title: messageTranslation.Bill,
      children: [
        {
          title: messageTranslation.BillService,
          href: `/bill-services`,
        },
        {
          title: messageTranslation.ReceiptService,
          href: `/receipt-services`,
        },
      ],
    },
  ],
  SALE_INVOICE_VIEW: [
    {
      title: messageTranslation.SaleInvoice,
      children: [
        {
          title: messageTranslation.Invoice,
          href: `/invoices`,
        },
        {
          title: messageTranslation.Quotation,
          href: `/quotations`,
        },
      ],
    },
  ],
  SERVICE_VIEW: [{ title: messageTranslation.Service, href: "/services" }],
};

// Dropdown component
function NavDropdown({ item, pathname }: { item: MenuItem; pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveChild = item.children?.some(
    (child) => pathname === child.href
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
          hasActiveChild
            ? "bg-gray-300 text-gray-900"
            : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        }`}
      >
        {item.title}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 bg-white shadow-lg rounded-md border min-w-[200px] py-1">
          {item.children?.map((child) => {
            const isActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`block px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {child.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return null;
  }

  const { user } = session || {};
  const userRole = user?.role as string;
  const userPermissions: string[] = (user?.permissions || []) as string[];

  let menuItems: MenuItem[] = COMMON_PUBLIC.map((item) => ({ ...item }));

  if (userRole === Role.ADMIN) {
    menuItems = ROLE_MENUS.ADMIN.map((item) => ({ ...item }));
  } else if (userPermissions.length > 0) {
    menuItems = userPermissions
      .flatMap((p) => PERMISSION_MENUS[p] || [])
      .filter((item): item is MenuItem => Boolean(item));
  }

  // Add "Dashboard" and "Home" for all logged-in users
  if (user) {
    const baseMenus: MenuItem[] = [
      { title: messageTranslation.Home, href: "/" },
      // { title: "dashboard", href: "/dashboard" },
    ];

    const existingHefts = new Set(
      menuItems.flatMap((m) =>
        m.href ? [m.href] : m.children?.map((c) => c.href) || []
      )
    );

    const filteredBase = baseMenus.filter((m) => !existingHefts.has(m.href!));
    menuItems = [...filteredBase, ...menuItems];
  }

  return (
    <nav
      suppressHydrationWarning
      className="sticky top-0 z-50 bg-white shadow-sm border-b"
    >
      <div className="max-w mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-2">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-gray-800">Test</span>

            <div className="hidden md:flex items-center">
              {menuItems.map((item, index) => {
                // If item has children, render dropdown
                if (item.children) {
                  return (
                    <NavDropdown
                      key={`${item.title}-${index}`}
                      item={item}
                      pathname={pathname}
                    />
                  );
                }

                // Otherwise render normal link
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gray-300 text-gray-900"
                        : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AuthButtons />
          </div>
        </div>
      </div>
    </nav>
  );
}
