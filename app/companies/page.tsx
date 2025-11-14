"use client";

import { useState } from "react";
import { Search, RefreshCcw, Plus, Edit, Trash } from "lucide-react";
import Pagination from "@/components/Pagination";
import Swal from "sweetalert2";
import { useAlert } from "@/app/hooks/useAlert";
import { useAuth } from "@/app/hooks/useAuth";
import { usePagination } from "@/app/hooks/usePagination";
import {
  activeStatusTranslation,
  create,
  edit,
  filter,
  messageTranslation,
  PermissionConst,
  searchBy,
} from "@/lib/constant";
import {
  createCompany,
  updateActiveCompany,
  updateCompany,
} from "@/action/companies";
import Loader from "@/components/Loader";
import { ActiveState } from "@prisma/client";

export default function CustomerPage() {
  const {
    showSuccess,
    showError,
    showConfirm,
    showProcessing,
    closeProcessing,
  } = useAlert();
  const [search, setSearchTerm] = useState({ name: "", phone: "" });
  const {
    items: companies,
    pagination,
    loading,
    page,
    setPage,
    reloadData,
    applyFilters,
    clearFilters,
  } = usePagination("/companies");
  const { hasPermission } = useAuth();

  const handleApplyFilters = () => {
    applyFilters({
      name: search.name,
      phone: search.phone,
    });
  };
  const handleClearFilters = () => {
    setSearchTerm({ name: "", phone: "" });
    clearFilters();
  };

  const showCustomerForm = async (company?: any) => {
    const { value: formData } = await Swal.fire({
      title: company
        ? edit(messageTranslation.Company)
        : create(messageTranslation.Company),
      width: 700,
      html: `
  <div style="text-align: left; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">

    <!-- Name -->
    <div style="display: flex; flex-direction: column;">
      <label style="margin-bottom: 6px; font-weight: 500;">
        ${messageTranslation.Name}
      </label>
      <input 
        id="swal-name"
        class="swal2-input"
        placeholder=${messageTranslation.Placeholder}
        value="${company?.name || ""}"
        style="margin:0;"
      >
    </div>

    <!-- Tax Number -->
    <div style="display: flex; flex-direction: column;">
      <label style="margin-bottom: 6px; font-weight: 600;">
        ${messageTranslation.TaxNumber}
      </label>
      <input 
        id="swal-taxNumber"
        class="swal2-input"
        placeholder=${messageTranslation.Placeholder}
        value="${company?.taxNumber || ""}"
        style="margin:0;"
      >
    </div>

    <!-- Phone -->
    <div style="display: flex; flex-direction: column;">
      <label style="margin-bottom: 6px; font-weight: 600;">
        ${messageTranslation.Phone}
      </label>
      <input 
        id="swal-phone"
        class="swal2-input"
        type="tel"
        placeholder=${messageTranslation.Placeholder}
        value="${company?.phone || ""}"
        style="margin:0;"
      >
    </div>

    <!-- Manager Contact -->
    <div style="display: flex; flex-direction: column;">
      <label style="margin-bottom: 6px; font-weight: 600;">
        ${messageTranslation.ManagerContact}
      </label>
      <input 
        id="swal-managerContact"
        class="swal2-input"
        placeholder=${messageTranslation.Placeholder}
        value="${company?.managerContact || ""}"
        style="margin:0;"
      >
    </div>

    <!-- Email (full width of 1 column but inside grid) -->
    <div style="display: flex; flex-direction: column;">
      <label style="margin-bottom: 6px; font-weight: 600;">
        ${messageTranslation.Email}
      </label>
      <input 
        id="swal-email"
        class="swal2-input"
        placeholder=${messageTranslation.Placeholder}
        value="${company?.email || ""}"
        style="margin:0;"
      >
    </div>

  </div>

  <!-- Address Full Width -->
  <div style="margin-top: 16px; text-align: left;">
    <label style="display: block; margin-bottom: 6px; font-weight: 600;">
      ${messageTranslation.Address}
    </label>
    <textarea 
      id="swal-address"
      class="swal2-textarea"
      placeholder=${messageTranslation.Placeholder}
      style="width: 70%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-height: 80px; resize: vertical; font-family: inherit;"
    >${company?.address || ""}</textarea>
  </div>
`,

      focusConfirm: false,
      confirmButtonText: messageTranslation.Submit,
      showCancelButton: true,
      cancelButtonText: messageTranslation.Cancel,
      preConfirm: () => {
        const name = (
          document.getElementById("swal-name") as HTMLInputElement
        )?.value?.trim();
        const phone = (
          document.getElementById("swal-phone") as HTMLInputElement
        )?.value?.trim();
        const address = (
          document.getElementById("swal-address") as HTMLTextAreaElement
        )?.value?.trim();
        const taxNumber = (
          document.getElementById("swal-taxNumber") as HTMLTextAreaElement
        )?.value?.trim();
        const managerContact = (
          document.getElementById("swal-managerContact") as HTMLTextAreaElement
        )?.value?.trim();
        const email = (
          document.getElementById("swal-email") as HTMLTextAreaElement
        )?.value?.trim();
        if (!name || !phone || !address || !taxNumber || !managerContact) {
          Swal.showValidationMessage(messageTranslation.Require);
          return false;
        }

        return {
          name: name,
          phone: phone,
          email: email,
          address: address,
          taxNumber: taxNumber,
          managerContact: managerContact,
        };
      },
    });

    if (formData) {
      let result;
      showProcessing();
      if (company) {
        result = await updateCompany(company.id, formData);
      } else {
        result = await createCompany(formData);
      }

      if (result.success) {
        showSuccess(result.message);
        reloadData();
      } else {
        showError(result.message);
      }
      closeProcessing;
    }
  };

  const handleActiveStatus = async (company: any) => {
    // หา status ที่จะเปลี่ยนเป็น
    const nextStatus =
      company.activeStatus === ActiveState.ACTIVE
        ? ActiveState.INACTIVE
        : ActiveState.ACTIVE;

    // หา label แปลภาษาที่จะแสดง
    const nextStatusLabel = activeStatusTranslation[nextStatus];
    const text = `ທ່ານແນ່ໃຈບໍ່ວ່າຈະ${nextStatusLabel} ${company.name} ນີ້`;

    const confirm = await showConfirm(text, messageTranslation.SettingStatus);

    if (confirm) {
      let result;
      showProcessing();

      result = await updateActiveCompany(company.id, nextStatus);

      if (result.success) {
        showSuccess(result.message);
        reloadData();
      } else {
        showError(result.message);
      }
      closeProcessing;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {messageTranslation.Company}
        </h1>
        {hasPermission(PermissionConst.COMPANY_CREATE) && (
          <button
            onClick={() => showCustomerForm()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            {create(messageTranslation.Company)}
          </button>
        )}
      </div>
      {/* Filter Card */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {filter(messageTranslation.Company)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={searchBy(messageTranslation.Name)}
            value={search.name}
            onChange={(e) => setSearchTerm({ ...search, name: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder={searchBy(messageTranslation.Phone)}
            value={search.phone}
            onChange={(e) =>
              setSearchTerm({ ...search, phone: e.target.value })
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
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        {loading ? (
          <Loader />
        ) : companies.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {messageTranslation.NoData}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Stt}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Name}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Phone}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Address}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.ActiveStatus}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {companies.map(
                (company: {
                  id: string;
                  stt: number;
                  name: string;
                  phone: string;
                  address: string;
                  activeStatus: ActiveState;
                }) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {company.stt}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {company.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {company.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {company.address || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`font-medium ${
                          company.activeStatus === ActiveState.ACTIVE
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {activeStatusTranslation[company.activeStatus]}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {hasPermission(PermissionConst.COMPANY_UPDATE) && (
                          <button
                            onClick={() => showCustomerForm(company)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition"
                          >
                            <Edit size={14} />
                            {messageTranslation.Update}
                          </button>
                        )}
                        {hasPermission(PermissionConst.COMPANY_DELETE) && (
                          <button
                            onClick={() => handleActiveStatus(company)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition"
                          >
                            <Trash size={14} />
                            {messageTranslation.SettingStatus}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
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
