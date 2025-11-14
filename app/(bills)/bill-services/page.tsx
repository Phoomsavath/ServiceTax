"use client";

import { usePagination } from "@/app/hooks/usePagination";
import { useState } from "react";
import { Search, RefreshCcw, Plus, Edit, Trash, Eye } from "lucide-react";
import Pagination from "@/components/Pagination";
import { formatDate } from "@/lib/formateTime";
import { useAuth } from "@/app/hooks/useAuth";
import { formatCurrency } from "@/lib/getCurrencySymbol";
import {
  create,
  edit,
  filter,
  messageTranslation,
  PaidStatusTranslation,
  PermissionConst,
  searchBy,
  viewMode,
} from "@/lib/constant";
import { BillType, InvoiceType, PaidType } from "@prisma/client";
import CreateSaleInvoiceForm from "@/components/form/Sale-invoice/CreateSaleInvoiceForm";
import EditSaleInvoiceForm from "@/components/form/Sale-invoice/EditSaleInvoiceForm";
import ViewSaleInvoice from "@/components/form/Sale-invoice/ViewSaleInvoice";
import { useAlert } from "@/app/hooks/useAlert";
import Loader from "@/components/Loader";
import Swal from "sweetalert2";
import { promoteQuotationToInvoice } from "@/action/saleInvoice";
import CreateBillForm from "@/components/form/Bill/CreateBillForm";
import EditBillForm from "@/components/form/Bill/EditBillForm";
import { promoteBillToReceiptService } from "@/action/bills";

export default function BillPage() {
  const [mode, setMode] = useState<viewMode>(viewMode.List);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { hasPermission } = useAuth();
  const { showProcessing, closeProcessing, showSuccess, showError } =
    useAlert();
  const [search, setSearch] = useState({
    invoiceNo: "",
    // customerName: "",
  });
  const {
    items: bills,
    pagination,
    loading,
    page,
    setPage,
    applyFilters,
    clearFilters,
    reloadData,
  } = usePagination(`/receipt-services?type=${BillType.BILL_SERVICE}`);
  const handleApplyFilters = () => {
    applyFilters({
      invoiceNo: search.invoiceNo,
      // customerName: search.customerName,
    });
  };

  const handleClearFilters = () => {
    setSearch({
      invoiceNo: "",
      //    customerName: "",
    });
    clearFilters();
  };

  const showPromoteForm = async (bill?: any) => {
    // Get existing warehouse IDs for the product

    const { value: formData } = await Swal.fire({
      title: edit(messageTranslation.Service),
      html: `
          <div style="text-align: left;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
              messageTranslation.QuotationNo
            }</label>
            <input 
              id="swal-quotationNo" 
              class="swal2-input" 
              
              disabled
              value="${bill?.saleInvoiceNo || ""}"
              style="margin-bottom: 15px; background-color: #f5f5f5; color: #888; cursor: not-allowed;"
            >
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
              messageTranslation.InvoiceNo
            }
            </label>
            <input 
              id="swal-invoiceNo" 
              class="swal2-input" 
              placeholder="${messageTranslation.Placeholder}"
              value=""
              style="margin-bottom: 15px;"
            >
          </div>
        `,
      focusConfirm: false,
      confirmButtonText: messageTranslation.Submit,
      showCancelButton: true,
      cancelButtonText: messageTranslation.Cancel,
      width: "600px",
      preConfirm: () => {
        const invoiceNo = (
          document.getElementById("swal-invoiceNo") as HTMLInputElement
        )?.value?.trim();

        return {
          invoiceNo,
        };
      },
    });

    if (formData) {
      let result;
      showProcessing();

      result = await promoteBillToReceiptService(bill.id, formData.invoiceNo);

      closeProcessing();

      if (result.success) {
        showSuccess(result.message);
        reloadData();
      } else {
        showError(result.message);
      }
    }
  };
  // Helper: format currency

  const handleBackToList = () => {
    setMode(viewMode.List);
    setSelectedId(null);
    reloadData(); // reload list when coming back (after create/edit)
  };

  if (mode === viewMode.Create)
    return (
      <CreateBillForm
        type={BillType.BILL_SERVICE}
        onCancel={handleBackToList}
      />
    );
  if (mode === viewMode.Edit && selectedId)
    return (
      <EditBillForm
        type={BillType.BILL_SERVICE}
        billId={selectedId}
        onCancel={handleBackToList}
      />
    );
  if (mode === viewMode.View && selectedId)
    return (
      <ViewSaleInvoice
        invoiceId={selectedId}
        textOnly={messageTranslation.Quotation}
        onClose={handleBackToList}
      />
    );
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {messageTranslation.BillService}
        </h1>
        {hasPermission(PermissionConst.SALE_INVOICE_CREATE) && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={() => {
              setMode(viewMode.Create);
            }}
          >
            <Plus size={18} />
            {create(messageTranslation.BillService)}
          </button>
        )}
      </div>

      {/* Filter Card */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {filter(messageTranslation.BillService)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder={searchBy(messageTranslation.InvoiceNo)}
            value={search.invoiceNo}
            onChange={(e) =>
              setSearch({ ...search, invoiceNo: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCcw size={16} />
            {messageTranslation.Clear}
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Search size={16} />
            {messageTranslation.Apply}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <Loader />
        ) : bills.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {messageTranslation.NoData}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.Stt}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.InvoiceNo}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.CreatedAt}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.TotalAmount}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.CreatedBy}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.UpdatedBy}
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {invoice.stt}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {invoice.invoiceNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {invoice.createdBy?.fullName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {invoice.updatedBy?.fullName || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedId(invoice.id);
                            setMode(viewMode.View);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition"
                        >
                          <Eye size={14} /> {messageTranslation.View}
                        </button>

                        {!invoice.subBills && (
                          <>
                            {hasPermission(
                              PermissionConst.SALE_INVOICE_UPDATE
                            ) && (
                              <button
                                onClick={() => showPromoteForm(invoice)}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition"
                              >
                                <Edit size={14} />
                                {messageTranslation.PromoteToReceipt}
                              </button>
                            )}
                          </>
                        )}

                        {hasPermission(PermissionConst.SALE_INVOICE_UPDATE) && (
                          <button
                            onClick={() => {
                              setSelectedId(invoice.id);
                              setMode(viewMode.Edit);
                            }}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition"
                          >
                            <Edit size={14} /> {messageTranslation.Edit}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <Pagination
          pagination={pagination}
          page={page}
          setPage={setPage}
          loading={loading}
        />
      )}
    </div>
  );
}
