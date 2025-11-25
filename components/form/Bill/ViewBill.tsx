"use client";

import { Package, User, DollarSign } from "lucide-react";

import { use, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { formatCurrency } from "@/lib/getCurrencySymbol";
import { useAlert } from "@/app/hooks/useAlert";
import { useReactToPrint } from "react-to-print";
import { formatDate } from "@/lib/formateTime";

import { useApiWithAlert } from "@/lib/apiWithAlert";
import { useRouter } from "next/navigation";
import { messageTranslation } from "@/lib/constant";
import Loader from "@/components/Loader";

interface ViewInvoiceFormProps {
  billId: number;
  onClose: () => void;
  onSuccess?: () => void;
  textOnly: string;
}
export default function ViewBill({
  billId,
  onClose,
  onSuccess,
  textOnly,
}: ViewInvoiceFormProps) {
  const { user } = useAuth();
  const api = useApiWithAlert();
  const [receiptService, setReceiptService] = useState<any>(null);
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
  }, [billId]);

  const loadInvoiceData = async () => {
    if (!billId) return;

    try {
      setLoading(true);

      // 1. Fetch invoice
      const { data: receiptServiceResponse } = await api.get(
        `/receipt-services/${billId}`
      );

      const receiptServiceData = receiptServiceResponse.data;
      // 2. Fetch stock data if warehouse exists

      // 3. Update state
      setReceiptService(receiptServiceData);
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
                {messageTranslation.InvoiceNo}: {receiptService.invoiceNo}
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
                <p className="font-semibold">{receiptService.company.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-500">
                  {messageTranslation.TotalAmount}
                </p>
                <p className="font-semibold">
                  {formatCurrency(receiptService.totalAmount)}
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
                    {messageTranslation.SaleInvoice}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.TotalAmount}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.CreatedAt}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receiptService.saleInvoices.map((item: any, index: any) => {
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {item.saleInvoiceNo}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-right font-semibold text-gray-700"
                  >
                    {messageTranslation.TotalAmount}:
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 text-lg">
                    {formatCurrency(receiptService.totalAmount)}
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

            {/* <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold">Issued By / ອອກໃຫ້ໂດຍ:</span>{" "}
                  {user?.fullName}
                </p>
              </div>
            </div> */}

            {/* Customer & Warehouse Info */}
            <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  ລູກຄ້າ / Customer : {receiptService.company.name}
                </h3>
                <p className="text-sm text-gray-600">
                  ສະຖານທີ່/Address: {receiptService.company.address || ""}
                </p>
                <p className="text-sm text-gray-600">
                  ເບີ/Tel: {receiptService.company.phone || ""}
                </p>
              </div>

              <div>
                <p className="text-gray-600">
                  <span className="font-semibold">
                    ເອກະສານເລກທີ / Invoice No:
                  </span>
                  {receiptService.invoiceNo}
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold"> ວັນທີ / Date:</span>
                  {formatDate(receiptService.createdAt)}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {messageTranslation.Stt}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {messageTranslation.SaleInvoice}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {messageTranslation.TotalAmount}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {messageTranslation.CreatedAt}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {receiptService.saleInvoices.map(
                    (item: any, index: number) => {
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-left text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            <div className="font-medium text-gray-900">
                              {item.saleInvoiceNo}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatCurrency(item.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-gray-900">
                            {formatDate(item.createdAt)}
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
                    colSpan={3}
                    className="px-4 py-4 text-right font-semibold text-gray-700 text-base"
                  >
                    ຍອດລວມທັງໝົດ / Total Amount:
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg">
                    {formatCurrency(receiptService.totalAmount)}
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
