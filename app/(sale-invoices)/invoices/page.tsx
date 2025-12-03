"use client";

import { usePagination } from "@/app/hooks/usePagination";
import { useEffect, useState } from "react";
import { Search, RefreshCcw, Plus, Edit, Trash, Eye } from "lucide-react";
import Pagination from "@/components/Pagination";
import { formatDate } from "@/lib/formateTime";
import { useAuth } from "@/app/hooks/useAuth";
import { formatCurrency } from "@/lib/getCurrencySymbol";
import {
  create,
  filter,
  messageTranslation,
  PaidStatusTranslation,
  PermissionConst,
  searchBy,
  SetTranslation,
  viewMode,
} from "@/lib/constant";
import { InvoiceType, PaidType, Set } from "@prisma/client";
import CreateSaleInvoiceForm from "@/components/form/Sale-invoice/CreateSaleInvoiceForm";
import EditSaleInvoiceForm from "@/components/form/Sale-invoice/EditSaleInvoiceForm";
import ViewSaleInvoice from "@/components/form/Sale-invoice/ViewSaleInvoice";
import Loader from "@/components/Loader";
import { useApiWithAlert } from "@/lib/apiWithAlert";

export default function InvoicePage() {
  const [mode, setMode] = useState<viewMode>(viewMode.List);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { hasPermission } = useAuth();
  const api = useApiWithAlert();
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState({
    invoiceNo: "",
    paidStatus: "",
    company: "",
  });
  const {
    items: invoices,
    pagination,
    loading,
    page,
    setPage,
    applyFilters,
    clearFilters,
    reloadData,
  } = usePagination(`/sale-invoices?type=${InvoiceType.INVOICE}`);
  const handleApplyFilters = () => {
    applyFilters({
      invoiceNo: search.invoiceNo,
      paidStatus: search.paidStatus,
      companyId: search.company,
    });
  };
  const handleClearFilters = () => {
    setSearch({
      invoiceNo: "",
      paidStatus: "",
      company: "",
    });
    clearFilters();
  };

  useEffect(() => {
    const loadCompanies = async () => {
      const { data: companies } = await api.get("/companies");
      const categoriesRes = companies?.data || [];
      setCompanies(categoriesRes);
    };
    loadCompanies();
  }, []);

  const handleBackToList = () => {
    setMode(viewMode.List);
    setSelectedId(null);
    reloadData(); // reload list when coming back (after create/edit)
  };

  if (mode === viewMode.Create)
    return (
      <CreateSaleInvoiceForm
        type={InvoiceType.INVOICE}
        onCancel={handleBackToList}
      />
    );
  if (mode === viewMode.Edit && selectedId)
    return (
      <EditSaleInvoiceForm
        type={InvoiceType.INVOICE}
        invoiceId={selectedId}
        onCancel={handleBackToList}
      />
    );
  if (mode === viewMode.View && selectedId)
    return (
      <ViewSaleInvoice
        invoiceId={selectedId}
        textOnly={messageTranslation.Invoice}
        onClose={handleBackToList}
      />
    );
  return (
    <div className="p-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {messageTranslation.Invoice}
        </h1>
        {hasPermission(PermissionConst.SALE_INVOICE_CREATE) && (
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={() => {
              setMode(viewMode.Create);
            }}
          >
            <Plus size={18} />
            {create(messageTranslation.Invoice)}
          </button>
        )}
      </div>

      {/* Filter Card */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {filter(messageTranslation.Invoice)}
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
          <select
            value={search.paidStatus}
            onChange={(e) =>
              setSearch({ ...search, paidStatus: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- {messageTranslation.PaidStatus} --</option>
            {Object.values(PaidType).map((p) => (
              <option key={p} value={p}>
                {PaidStatusTranslation[p]}
              </option>
            ))}
          </select>
          <select
            value={search.company}
            onChange={(e) => setSearch({ ...search, company: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          >
            <option value="all">-{messageTranslation.Company}-</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
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
        ) : invoices.length === 0 ? (
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
                    {messageTranslation.CreatedAt}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.InvoiceNo}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.QuotationNo}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.PaidStatus}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.Company}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.Category}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {messageTranslation.UpdatedAt}
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
                {invoices.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {invoice.stt}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(invoice.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      {invoice.saleInvoiceNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.quotation?.saleInvoiceNo || "-"}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${
                        invoice.paidStatus === "PAID"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {PaidStatusTranslation[invoice.paidStatus as PaidType]}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.company?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {SetTranslation[invoice.set as Set]}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(invoice.updatedAt) || "-"}
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
                            setSelectedId(
                              invoice.quotation
                                ? invoice.quotation.id
                                : invoice.id
                            );
                            setMode(viewMode.View);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition"
                        >
                          <Eye size={14} /> {messageTranslation.View}
                        </button>

                        {hasPermission(PermissionConst.SALE_INVOICE_UPDATE) && (
                          <button
                            onClick={() => {
                              setSelectedId(
                                invoice.quotation
                                  ? invoice.quotation.id
                                  : invoice.id
                              );
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
