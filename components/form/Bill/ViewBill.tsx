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
import { messageTranslation, PaidStatusTranslation } from "@/lib/constant";
import Loader from "@/components/Loader";
import { PaidType } from "@prisma/client";

interface ViewInvoiceFormProps {
  billId: number;
  onClose: () => void;
  onSuccess?: () => void;
  textOnly: string;
  filterPaidStatus?: PaidType; // Optional filter prop
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
  const [selectedPaidStatus, setSelectedPaidStatus] = useState<
    PaidType | "all"
  >("all");
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const reactToPrintFn = useReactToPrint({
    contentRef,
    onBeforePrint: async () => {
      setIsPrinting(true);
    },
    onAfterPrint: () => {
      setTimeout(() => setIsPrinting(false), 1000);
    },
  });

  useEffect(() => {
    loadInvoiceData();
  }, [billId]);

  const loadInvoiceData = async () => {
    if (!billId) return;

    try {
      setLoading(true);
      const { data: receiptServiceResponse } = await api.get(
        `/receipt-services/${billId}`
      );
      setReceiptService(receiptServiceResponse.data);
    } catch (error: any) {
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices based on selected paid status
  const getFilteredInvoices = () => {
    if (!receiptService?.saleInvoices) return [];

    if (selectedPaidStatus === "all") {
      return receiptService.saleInvoices;
    }

    return receiptService.saleInvoices.filter(
      (invoice: any) => invoice.paidStatus === selectedPaidStatus
    );
  };

  // Calculate total amount for filtered invoices
  const getFilteredTotal = () => {
    const filteredInvoices = getFilteredInvoices();
    return filteredInvoices.reduce(
      (sum: number, invoice: any) => sum + Number(invoice.totalAmount),
      0
    );
  };

  if (loading) {
    return <Loader />;
  }

  const filteredInvoices = getFilteredInvoices();
  const filteredTotal = getFilteredTotal();

  const renderInvoicesTable = (
    invoices: any[],
    total: number,
    showPaidStatus: boolean = true
  ) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {messageTranslation.Stt}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {messageTranslation.InvoiceNo}
            </th>
            {showPaidStatus && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {messageTranslation.PaidStatus}
              </th>
            )}
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {messageTranslation.CreatedAt}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {messageTranslation.TotalAmount}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((item: any, index: any) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-900">
                {index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                <div className="font-medium text-gray-900">
                  {item.saleInvoiceNo}
                </div>
              </td>
              {showPaidStatus && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      item.paidStatus === PaidType.PAID
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {PaidStatusTranslation[item.paidStatus as PaidType]}
                  </span>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                {formatDate(item.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                {formatCurrency(item.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td
              colSpan={4}
              className="px-6 py-4 text-right font-semibold text-gray-700"
            >
              {messageTranslation.TotalAmount}:
            </td>
            <td className="px-6 py-4 text-right font-bold text-gray-900 text-lg">
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

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
              <p className="text-gray-600 mt-1">
                {textOnly}: {receiptService.invoiceNo}
              </p>
            </div>
            <button
              onClick={() => {
                reactToPrintFn();
              }}
              disabled={isPrinting}
              className="bg-gray-600 text-white px-4 py-2 rounded transition hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isPrinting ? "ກຳລັງປີ້ນ..." : "ປີ້ນ"}
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setSelectedPaidStatus("all")}
              className={`px-4 py-2 rounded transition ${
                selectedPaidStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All Status
            </button>
            {Object.values(PaidType).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedPaidStatus(status)}
                className={`px-4 py-2 rounded transition ${
                  selectedPaidStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {PaidStatusTranslation[status]}
              </button>
            ))}
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
                  {selectedPaidStatus === "all"
                    ? "Total Amount"
                    : "Filtered Total"}
                </p>
                <p className="font-semibold">{formatCurrency(filteredTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Package size={20} />
              Invoice Items
              {selectedPaidStatus !== "all" && (
                <span className="text-sm font-normal text-gray-600">
                  (Filtered:{" "}
                  {PaidStatusTranslation[selectedPaidStatus as PaidType]})
                </span>
              )}
            </h2>
          </div>

          {renderInvoicesTable(filteredInvoices, filteredTotal, true)}
        </div>

        {/* Print Version */}
        <div className="hidden print:block" ref={contentRef}>
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {/* Company Info */}
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-bold text-gray-800">
                      {"ບໍລິສັດ P&Safe CO.,LTD"}
                    </h1>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    ສະຖານທີ່ / Address: ບ.ສວນສະຫວັນ ມ.ປາກເຊ ຂ.ຈຳປາສັກ
                  </p>
                  <p className="text-sm text-gray-600">
                    ເບີ / Tel: 020 56628998 / 020 55351234 / 020 99954456
                  </p>
                  <p className="text-sm text-gray-600">
                    ເລກຜູ້ເສຍອາກອນ /Tax ID : 227085846-9-00
                  </p>
                </div>

                <div className="text-right">
                  <h1 className="text-xl font-semibold text-gray-700">
                    {textOnly}
                  </h1>
                  {selectedPaidStatus !== "all" && (
                    <p className="text-sm text-gray-600 mt-1">
                      {messageTranslation.PaidStatus}:{" "}
                      {PaidStatusTranslation[selectedPaidStatus as PaidType]}
                    </p>
                  )}
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

            {/* Customer Info */}
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
                <p className="text-sm text-gray-600">
                  ເລກຜູ້ເສຍອາກອນ /Tax ID:{" "}
                  {receiptService.company.taxNumber || ""}
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

          {/* Print Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      ລຳດັບ / Stt
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      ເລກທີ່ / Invoice No
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      ວັນທີ / Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                      ຍອດລວມ / Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInvoices.map((item: any, index: number) => (
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
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-3 print-footer">
            <table className="w-full">
              <tfoot className="bg-gray-50">
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-4 text-right font-semibold text-gray-700 text-base"
                  >
                    ຍອດລວມທັງໝົດ / Total Amount:
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900 text-lg">
                    {formatCurrency(filteredTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer - Signatures */}
          <div className="bg-white rounded-lg shadow-md p-1">
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
      </div>
    </div>
  );
}
