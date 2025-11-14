"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Plus, Minus, X, Package } from "lucide-react";
import { useAlert } from "@/app/hooks/useAlert";
import { formatCurrency } from "@/lib/getCurrencySymbol";
import { createApiWithAlert } from "@/lib/apiWithAlert";
import {
  create,
  messageTranslation,
  PaidStatusTranslation,
  searchBy,
} from "@/lib/constant";
import { BillType, InvoiceType, PaidType } from "@prisma/client";
import { createSaleInvoice } from "@/action/saleInvoice";
import { createReceiptService } from "@/action/bills";

interface CreateInvoiceFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
  type: BillType;
}

interface CartItem {
  id: number;
  saleInvoiceId: number;
  totalAmount: number;
  saleInvoiceNo: string;
}

export default function CreateBillForm({
  onCancel,
  onSuccess,
  type,
}: CreateInvoiceFormProps) {
  const { showError, showSuccess, showWarning } = useAlert();
  // States
  const [invoices, setInvoices] = useState<any[]>([]);

  const [selectedCompany, setSelectedCompany] = useState<any>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const api = createApiWithAlert();
  const [invoiceNo, setInvoiceNo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  // 2️⃣ Load products whenever warehouse, category, or searchTerm change
  useEffect(() => {
    loadInvoices();
    loadCompanies();
  }, [searchTerm]);
  const loadCompanies = async () => {
    const { data: companies } = await api.get("/companies");
    const categoriesRes = companies?.data || [];
    setCompanies(categoriesRes);
  };

  const loadInvoices = async () => {
    try {
      const params = new URLSearchParams();

      // Add filters conditionally
      if (searchTerm) params.append("invoiceNo", searchTerm);

      const { data } = await api.get(
        `/sale-invoices?type=${
          InvoiceType.INVOICE
        }&billId=${"unlinked"}&${params.toString()}`
      );

      setInvoices(data.success ? data.data : []);
    } catch (error) {
      setInvoices([]);
    }
  };

  const addToCart = (invoice: any) => {
    const existingItem = cart.find((item) => item.saleInvoiceId === invoice.id);

    if (!existingItem) {
      const newItem: CartItem = {
        id: Date.now(),
        saleInvoiceId: invoice.id,
        totalAmount: invoice.totalAmount,
        saleInvoiceNo: invoice.saleInvoiceNo,
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  };

  const handleCheckout = async () => {
    // Validation
    if (cart.length === 0) {
      showWarning("ກະລຸນາເພີ່ມສິນຄ້າລົງກະຕ່າ");
      return;
    }

    if (!invoiceNo.trim()) {
      showWarning("ກະລຸນາໃສ່ເລກທີໃບບິນ");
      return;
    }

    const billData = {
      invoiceNo: invoiceNo.trim(),
      companyId: parseInt(selectedCompany),
      type: type,
      items: cart.map((item) => ({
        invoiceId: item.saleInvoiceId,
        totalAmount: item.totalAmount,
      })),
    };
    const result = await createReceiptService(billData);

    if (result?.success) {
      showSuccess(result?.message);
      // Reset form
      clearCart();
      setSelectedCompany("");
      onSuccess?.();
      onCancel();
    } else {
      showError(result?.message);
    }
  };

  const totalAmount = calculateTotal();
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Side - Products (9 columns) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Filters */}
        <div className="bg-white border-b p-4">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-blue-600 mb-2 flex items-center gap-1"
          >
            ←{messageTranslation.Back}
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="text-blue-600" />

            {create(
              type === BillType.BILL_SERVICE
                ? messageTranslation.BillService
                : messageTranslation.ReceiptService
            )}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {searchBy(messageTranslation.Name)}
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder={searchBy(messageTranslation.Name)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => addToCart(invoice)}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4 cursor-pointer transition hover:shadow-md hover:border-blue-500"
              >
                <div className="flex flex-col h-full">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                    {messageTranslation.Invoice}: {invoice.saleInvoiceNo}
                  </h3>

                  <div className="mt-auto">
                    <p className="text-sm text-gray-600 mb-1">
                      {messageTranslation.Price}:
                      {formatCurrency(invoice.totalAmount)}
                    </p>
                    <div className="flex items-center justify-end">
                      <Plus size={16} className="text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Cart (3 columns) */}
      <div className="w-full md:w-96 bg-white border-l flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b space-y-3 max-h-[50vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={24} className="text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">
                {messageTranslation.Cart} ({cart.length})
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                {messageTranslation.Delete}
              </button>
            )}
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {type === BillType.BILL_SERVICE
                ? messageTranslation.BillServiceNo
                : messageTranslation.ReceiptServiceNo}
              *
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              placeholder="PO-202410-0001"
            />
          </div>
          {/* deliveryPoint Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {messageTranslation.Company} *
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            >
              <option value="">-- {messageTranslation.Company} --</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart size={64} className="mb-4" />
              <p>{messageTranslation.NoData}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item: any, index: any) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {`       ${messageTranslation.Invoice} (${index + 1}) : 
                        ${item.saleInvoiceNo}`}
                      </h4>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-gray-600">
                      {messageTranslation.Total}
                    </span>
                    <span className="font-bold text-blue-600">
                      {` ${formatCurrency(item.totalAmount)}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{messageTranslation.TotalAmount}:</span>
              <span className="font-semibold">
                {` ${formatCurrency(totalAmount)}`}
              </span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {messageTranslation.Create}
          </button>
        </div>
      </div>
    </div>
  );
}
