"use client";

import { Package, User, DollarSign } from "lucide-react";

import { use, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { formatCurrency } from "@/lib/getCurrencySymbol";
import { useReactToPrint } from "react-to-print";
import { formatDate } from "@/lib/formateTime";

import { useApiWithAlert } from "@/lib/apiWithAlert";
import { messageTranslation } from "@/lib/constant";
import Loader from "@/components/Loader";

interface ViewInvoiceFormProps {
  invoiceId: number;
  onClose: () => void;
  onSuccess?: () => void;
  textOnly: string;
}
export default function ViewSaleInvoice({
  invoiceId,
  onClose,
  onSuccess,
  textOnly,
}: ViewInvoiceFormProps) {
  const { user } = useAuth();
  const api = useApiWithAlert();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setTimeout(() => setIsPrinting(false), 1000); // Re-enable after 1 second
    },
  });

  useEffect(() => {
    loadInvoiceData();
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    if (!invoiceId) return;

    try {
      setLoading(true);

      // 1. Fetch invoice
      const { data: invoiceResponse } = await api.get(
        `/sale-invoices/${invoiceId}`
      );

      const invoiceData = invoiceResponse.data;

      // 2. Fetch stock data if warehouse exists

      // 3. Update state
      setInvoice(invoiceData);
    } catch (error: any) {
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <button
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-blue-600 mb-2 flex items-center gap-1"
              >
                ←{messageTranslation.Back}
              </button>
              <h1 className="text-3xl font-bold text-gray-800">{textOnly}</h1>
              <button
                onClick={() => {
                  reactToPrintFn();
                }}
                disabled={isPrinting}
                className="w-full bg-gray-600 text-white p-2 rounded transition 
             hover:bg-blue-600"
              >
                {isPrinting ? "ກຳລັງປີ້ນ..." : "ປີ້ນ"}
              </button>
              <p className="text-gray-600 mt-1">
                {messageTranslation.InvoiceNo}: {invoice.saleInvoiceNo}
              </p>
            </div>
          </div>

          {/* Invoice Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <User className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-500">
                  {messageTranslation.Company}
                </p>
                <p className="font-semibold">{invoice.company.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-500">
                  {messageTranslation.TotalAmount}
                </p>
                <p className="font-semibold">
                  {formatCurrency(invoice.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Warnings */}

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Package size={20} />
              Invoice Items
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.Stt}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.Service}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.Details}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.Cost}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.Price}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.Quantity}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.TotalAmount}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.saleInvoiceServices.map((item: any, index: any) => {
                  const subtotal = item.price * item.quantity;

                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {item.service.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 text-xs">
                          {(item.details || "N/A")
                            .split(",")
                            .map((detail: string, index: number) => (
                              <div key={index}>{detail}</div>
                            ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-right font-semibold text-gray-700"
                  >
                    {messageTranslation.TotalAmount}:
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 text-lg">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}

        <div className="hidden print:block" ref={contentRef}>
          {/* Header */}
          <div className=" bg-white rounded-lg shadow-md p-6 mb-6">
            {/* Company Info */}
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between items-start">
                {/* Left section (Logo + Company Info) */}
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    {/* <img
                      src={``}
                      alt="Company Logo"
                      className="w-30 h-30 object-contain"
                    /> */}

                    <h1 className="text-3xl font-bold text-gray-800">
                      {"P & Safe Co., Ltd."}
                    </h1>
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    ສະຖານທີ່ / Address:
                    {"Company Address"}
                  </p>
                  <p className="text-sm text-gray-600">
                    ເບີ / Tel: {"Phone Number"}
                  </p>
                </div>

                {/* Right section (Invoice title) */}
                <div className="text-right">
                  <h1 className="text-xl font-semibold text-gray-700">
                    {textOnly}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold">Issued By / ອອກໃຫ້ໂດຍ:</span>{" "}
                  {user?.fullName}
                </p>
              </div>
            </div>

            {/* Customer & Warehouse Info */}
            <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  ລູກຄ້າ/Customer : {invoice.company.name}
                </h3>
                <p className="text-sm text-gray-600">
                  ສະຖານທີ່/Address: {invoice.company.address || ""}
                </p>
                <p className="text-sm text-gray-600">
                  ເບີ/Tel: {invoice.company.phone || ""}
                </p>
              </div>

              <div>
                <p className="text-gray-600">
                  <span className="font-semibold">
                    ເອກະສານເລກທີ / Invoice No:
                  </span>
                  {invoice.saleInvoiceNo}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold"> ວັນທີ / Date:</span>
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      ລຳດັບ / Stt
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      ບໍລິການ / Service
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      ລາຍລະອຽດ / Details
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      ລາຄາ / Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      ຈຳນວນ / Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      ລວມ /Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.saleInvoiceServices.map(
                    (item: any, index: number) => {
                      const subtotal = item.price * item.quantity;

                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-left text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            <div className="font-medium text-gray-900">
                              {item.service.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 text-xs">
                              {(item.details || "N/A")
                                .split(",")
                                .map((detail: string, index: number) => (
                                  <div key={index}>{detail}</div>
                                ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900 font-medium">
                            {formatCurrency(subtotal)}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 print-footer">
            <table className="w-full">
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-4 text-right font-semibold text-gray-700 text-base"
                  >
                    ຍອດລວມທັງໝົດ / Total Amount:
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer - Signatures */}
          <div className="bg-white rounded-lg shadow-md p-3">
            <div className="grid grid-cols-3 gap-8 mt-4">
              <div className="text-center">
                <div className="border-b-2 border-gray-300 pb-2 mb-12">
                  <p className="font-medium">Customer Signature</p>
                  <p className="text-sm text-gray-600">ລາຍເຊັນລູກຄ້າ</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-gray-300 pb-2 mb-12">
                  <p className="font-medium">Staff Signature</p>
                  <p className="text-sm text-gray-600">ລາຍເຊັນພະນັກງານ</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-gray-300 pb-2 mb-12">
                  <p className="font-medium">Manager Signature</p>
                  <p className="text-sm text-gray-600">ລາຍເຊັນຜູ້ຈັດການ</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t text-center text-sm text-gray-500">
              <p>Thank you for your business! / ຂອບໃຈທີ່ໃຊ້ບໍລິການ!</p>
            </div>
          </div>
        </div>
        {/* Confirmation Dialog */}
      </div>
    </div>
  );
}
