"use client";

import { useState, useEffect, use } from "react";
import { Search, ShoppingCart, Plus, Minus, X, Package } from "lucide-react";

import { formatCurrency } from "@/lib/getCurrencySymbol";
import { createApiWithAlert } from "@/lib/apiWithAlert";
import { useAlert } from "@/app/hooks/useAlert";
import { edit, messageTranslation } from "@/lib/constant";
import { BillType, InvoiceType } from "@prisma/client";
import { updateReceiptService } from "@/action/bills";
interface EditInvoiceFormProps {
  billId: number;
  onCancel: () => void;
  onSuccess?: () => void;
  type: BillType;
}
interface CartItem {
  id: number;
  invoiceId: number;
  saleInvoiceNo: string;
  totalAmount: number;
}

export default function EditBillForm({
  billId,
  onCancel,
  onSuccess,
  type,
}: EditInvoiceFormProps) {
  const api = createApiWithAlert();
  const { showSuccess, showError, showWarning } = useAlert();

  // States
  const [invoices, setInvoices] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState<string>("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadInitialData();
  }, [billId]);

  useEffect(() => {
    loadInvoices();
  }, [searchTerm]);

  const loadInitialData = async () => {
    if (!billId) return;
    try {
      setLoading(true);

      // Load invoice data with destructuring
      const { data: receiptServiceResponse } = await api.get(
        `/receipt-services/${billId}`
      );

      const receiptService = receiptServiceResponse.data;
      // Set read-only fields
      // Set editable fields
      setInvoiceNo(receiptService.invoiceNo);
      setCompany(receiptService.company?.name || "");
      // Load cart items from invoice
      const cartItems: CartItem[] = receiptService.saleInvoices.map(
        (item: any) => ({
          id: item.id,
          invoiceId: item.id,
          totalAmount: item.totalAmount,
          saleInvoiceNo: item.saleInvoiceNo,
        })
      );
      setCart(cartItems);

      // Load categories
    } catch (error) {
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const params = new URLSearchParams();

      // Add filters conditionally
      if (searchTerm) params.append("invoiceNo", searchTerm);

      const { data } = await api.get(
        `/sale-invoices?type=${
          InvoiceType.INVOICE
        }&billId=${billId}&${params.toString()}`
      );

      setInvoices(data.success ? data.data : []);
    } catch (error) {
      setInvoices([]);
    }
  };

  const addToCart = (invoice: any) => {
    const existingItem = cart.find((item) => item.invoiceId === invoice.id);
    if (!existingItem) {
      const newItem: CartItem = {
        id: Date.now(),
        invoiceId: invoice.id,
        totalAmount: invoice.totalAmount,
        saleInvoiceNo: invoice.saleInvoiceNo,
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  };

  const handleUpdate = async () => {
    // Validation
    if (cart.length === 0) {
      showWarning("ກະລຸນາເພີ່ມສິນຄ້າລົງກະຕ່າ");
      return;
    }

    const updateData = {
      items: cart.map((item) => ({
        invoiceId: item.invoiceId,
        totalAmount: item.totalAmount,
      })),
    };

    const result = await updateReceiptService(billId, updateData);
    console.log(result);
    if (result?.success) {
      showSuccess(result.message);
      onSuccess?.();
      onCancel();
    } else {
      showError(result.message);
    }
  };

  const totalAmount = calculateTotal();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">ກຳລັງໂຫຼດຂໍ້ມູນ...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Side - Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Filters */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onCancel}
              className="text-sm text-gray-600 hover:text-blue-600 mb-2 flex items-center gap-1"
            >
              ←{messageTranslation.Back}
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="text-blue-600" />
              {edit(
                type === BillType.BILL_SERVICE
                  ? messageTranslation.BillService
                  : messageTranslation.ReceiptService
              )}
            </h1>
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

      {/* Right Side - Cart */}
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
          </div>

          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {messageTranslation.InvoiceNo} *
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
              placeholder="PO-202410-0001"
            />
          </div>

          {/* Customer - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {messageTranslation.Company}
            </label>
            <input
              type="text"
              value={company}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
            />
          </div>

          {/* Paid Amount - Read Only */}
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
              {cart.map((item: any, index: number) => (
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
                  {/* Subtotal */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-gray-600">
                      {messageTranslation.Total}
                    </span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(item.totalAmount)}
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
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              {messageTranslation.Back}
            </button>
            <button
              onClick={handleUpdate}
              disabled={cart.length === 0}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {messageTranslation.Update}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
