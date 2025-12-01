"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCcw, Plus, Edit, Trash } from "lucide-react";
import Pagination from "@/components/Pagination";
import Swal from "sweetalert2";
import { useAlert } from "@/app/hooks/useAlert";

import { ActiveState, Category, Group, Unit } from "@prisma/client";
import { useAuth } from "@/app/hooks/useAuth";
import { formatCurrency } from "@/lib/getCurrencySymbol";
import { usePagination } from "@/app/hooks/usePagination";
import {
  activeStatusTranslation,
  CategoryTranslation,
  create,
  edit,
  filter,
  GroupTranslation,
  messageTranslation,
  PermissionConst,
  searchBy,
  Sets,
  UnitTranslation,
} from "@/lib/constant";
import Loader from "@/components/Loader";
import {
  createService,
  updateActiveService,
  updateService,
} from "../../action/services";

export default function ServicesPage() {
  const [search, setSearchTerm] = useState({ name: "", category: "" });
  const { hasPermission } = useAuth();
  const {
    showSuccess,
    showProcessing,
    showError,
    closeProcessing,
    showConfirm,
  } = useAlert();

  const {
    items: services,
    pagination,
    loading,
    page,
    setPage,
    applyFilters,
    clearFilters,
    reloadData,
  } = usePagination("/services");

  const handleApplyFilters = () => {
    applyFilters({
      name: search.name,
      category: search.category,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm({ name: "", category: "" });
    clearFilters();
  };

  const showProductForm = async (service?: any) => {
    const { value: formData } = await Swal.fire({
      title: service
        ? edit(messageTranslation.Service)
        : create(messageTranslation.Service),
      html: `
      <div style="text-align: left;">
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
          messageTranslation.Service
        }</label>
        <input 
          id="swal-name" 
          class="swal2-input" 
          placeholder=${messageTranslation.Placeholder}
          value="${service?.name || ""}"
          style="margin-bottom: 15px;"
        >
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
          messageTranslation.Category
        }</label>
        <select 
          id="swal-category" 
          style="width: 70%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; font-size: 20px;"
        >
          <option value="">-- ${messageTranslation.Category} --</option>
          ${Object.values(Category)
            .map(
              (cat) =>
                `<option value="${cat}" ${
                  service?.category === cat ? "selected" : ""
                }>${CategoryTranslation[cat]}</option>`
            )
            .join("")}
        </select>
                <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
                  messageTranslation.Group
                }</label>
        <select 
          id="swal-group" 
          style="width: 70%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; font-size: 20px;"
        >
          <option value="" disabled>-- ${messageTranslation.Group} --</option>
          ${Object.values(Group)
            .map(
              (g) =>
                `<option value="${g}" ${
                  service?.group === g ? "selected" : ""
                }>${GroupTranslation[g]}</option>`
            )
            .join("")}
        </select>
        
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">
          ${messageTranslation.Set}
        </label>
        <div 
          id="swal-sets-container"
          style="
            width: 70%; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            margin-bottom: 15px; 
            max-height: 150px; 
            overflow-y: auto;
            background-color: #fff;
          "
        >
          ${Object.values(Sets)
            .map(
              (s) => `
                <div style="margin-bottom: 8px;">
                  <label style="display: flex; align-items: center; cursor: pointer;">
                    <input 
                      type="checkbox" 
                      name="sets" 
                      value="${s}" 
                      ${
                        Array.isArray(service?.sets) && service.sets.includes(s)
                          ? "checked"
                          : ""
                      }
                      style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;"
                    >
                    <span style="font-size: 16px;">${s}</span>
                  </label>
                </div>
              `
            )
            .join("")}
        </div>

        <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
          messageTranslation.Unit
        }</label>
        <select 
          id="swal-unit" 
          style="width: 70%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px; font-size: 20px;"
        >
          <option value="">-- ${messageTranslation.Unit} --</option>
          ${Object.values(Unit)
            .map(
              (unit) =>
                `<option value="${unit}" ${
                  service?.unit === unit ? "selected" : ""
                }>${UnitTranslation[unit]}</option>`
            )
            .join("")}
        </select>
    
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
          messageTranslation.Cost
        }</label>
        <input 
          id="swal-cost" 
          class="swal2-input" 
          type="number"
          step="0.01"
          placeholder="${messageTranslation.Placeholder}"
          value="${service?.cost || ""}"
          style="margin-bottom: 15px;"
        >
        <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
          messageTranslation.Price
        }</label>
        <input 
          id="swal-price" 
          class="swal2-input" 
          type="number"
          step="0.01"
          placeholder="${messageTranslation.Placeholder}"
          value="${service?.price || ""}"
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
        const name = (
          document.getElementById("swal-name") as HTMLInputElement
        )?.value.trim();
        const category = (
          document.getElementById("swal-category") as HTMLSelectElement
        )?.value;
        const group = (
          document.getElementById("swal-group") as HTMLSelectElement
        )?.value;
        const unit = (document.getElementById("swal-unit") as HTMLSelectElement)
          ?.value;

        // Get all checked checkboxes for sets
        const sets = Array.from(
          document.querySelectorAll<HTMLInputElement>(
            'input[name="sets"]:checked'
          )
        ).map((checkbox) => checkbox.value);

        const cost = parseFloat(
          (document.getElementById("swal-cost") as HTMLInputElement)?.value ||
            "0"
        );

        const price = parseFloat(
          (document.getElementById("swal-price") as HTMLInputElement)?.value ||
            "0"
        );

        if (!name) {
          Swal.showValidationMessage(messageTranslation.AllFiledRequired);
          return false;
        }

        return {
          name,
          category,
          sets, // array of selected checkbox values
          unit,
          cost,
          group,
          price,
        };
      },
    });

    if (formData) {
      let result;
      showProcessing();
      if (service) {
        result = await updateService(service.id, formData);
      } else {
        result = await createService(formData);
      }
      closeProcessing();

      if (result.success) {
        showSuccess(result.message);
        reloadData();
      } else {
        showError(result.message);
      }
    }
  };

  const handleActiveStatus = async (service: any) => {
    // หา status ที่จะเปลี่ยนเป็น
    const nextStatus =
      service.activeStatus === ActiveState.ACTIVE
        ? ActiveState.INACTIVE
        : ActiveState.ACTIVE;

    // หา label แปลภาษาที่จะแสดง
    const nextStatusLabel = activeStatusTranslation[nextStatus];
    const text = `ທ່ານແນ່ໃຈບໍ່ວ່າຈະ${nextStatusLabel} ${service.name} ນີ້`;

    const confirm = await showConfirm(text, messageTranslation.SettingStatus);

    if (confirm) {
      let result;
      showProcessing();

      result = await updateActiveService(service.id, nextStatus);

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
    <div className="p-8 max-w-8xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {messageTranslation.Service}
        </h1>
        {hasPermission(PermissionConst.SERVICE_CREATE) && (
          <button
            onClick={() => showProductForm()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={18} />
            {create(messageTranslation.Service)}
          </button>
        )}
      </div>

      {/* Filter Card */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {filter(messageTranslation.Service)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={searchBy(messageTranslation.Name)}
            value={search.name}
            onChange={(e) => setSearchTerm({ ...search, name: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={search.category}
            onChange={(e) =>
              setSearchTerm({ ...search, category: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- {messageTranslation.Category} --</option>
            {Object.values(Category).map((p) => (
              <option key={p} value={p}>
                {CategoryTranslation[p]}
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
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
        {loading ? (
          <Loader />
        ) : services.length === 0 ? (
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Name}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Category}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Unit}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Cost}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Price}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.CreatedBy}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.UpdatedBy}
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
              {(
                services as Array<{
                  id: string;
                  stt: number;
                  name: string;
                  category: Category;
                  unit: Unit;
                  cost: number;
                  price: number;
                  sets: any;
                  createdBy: { fullName: string };
                  updatedBy: { fullName: string };
                  activeStatus: ActiveState;
                }>
              ).map((service) => (
                <tr key={service.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {service.stt}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {CategoryTranslation[service.category]}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {UnitTranslation[service.unit]}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatCurrency(service.cost)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatCurrency(service.price)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {service.createdBy?.fullName || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {service.updatedBy?.fullName || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`font-medium ${
                        service.activeStatus === ActiveState.ACTIVE
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {activeStatusTranslation[service.activeStatus]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {hasPermission(PermissionConst.SERVICE_UPDATE) && (
                        <button
                          onClick={() => showProductForm(service)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition"
                        >
                          <Edit size={14} />
                          {messageTranslation.Update}
                        </button>
                      )}
                      {hasPermission(PermissionConst.SERVICE_DELETE) && (
                        <button
                          onClick={() => handleActiveStatus(service)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition"
                        >
                          <Trash size={14} />
                          {messageTranslation.SettingStatus}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
