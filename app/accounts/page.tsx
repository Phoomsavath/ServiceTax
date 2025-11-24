"use client";

import { useState } from "react";
import {
  Search,
  RefreshCcw,
  Plus,
  Edit,
  Trash,
  UserRoundCog,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import { usePagination } from "@/app/hooks/usePagination";
import Loader from "@/components/Loader";
import {
  activeStatusTranslation,
  create,
  edit,
  filter,
  messageTranslation,
  PermissionConst,
  searchBy,
} from "@/lib/constant";
import Link from "next/link";
import Swal from "sweetalert2";
import { useAlert } from "../hooks/useAlert";
import { changePassword, resetPassword } from "@/action/changePassword";
import { useAuth } from "../hooks/useAuth";
import { updateActiveUser } from "@/action/users";
import { ActiveState, Role } from "@prisma/client";

export default function AccountsPage() {
  const [search, setSearch] = useState({ userName: "", companyName: "" });
  const {
    showProcessing,
    closeProcessing,
    showError,
    showSuccess,
    showConfirm,
  } = useAlert();
  const { hasPermission } = useAuth();
  const {
    items: users,
    pagination,
    loading,
    page,
    setPage,
    reloadData,
    applyFilters,
    clearFilters,
  } = usePagination("/accounts");

  const handleApplyFilters = () => {
    applyFilters({
      userName: search.userName,
      companyName: search.companyName,
    });
  };

  const handleClearFilters = () => {
    setSearch({ userName: "", companyName: "" });
    clearFilters();
  };
  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <Loader />;
      </div>
    );
  }
  const handleActiveStatus = async (acc: any) => {
    // หา status ที่จะเปลี่ยนเป็น
    const nextStatus =
      acc.activeStatus === ActiveState.ACTIVE
        ? ActiveState.INACTIVE
        : ActiveState.ACTIVE;

    // หา label แปลภาษาที่จะแสดง
    const nextStatusLabel = activeStatusTranslation[nextStatus];
    const text = `ທ່ານແນ່ໃຈບໍ່ວ່າຈະ${nextStatusLabel} ${acc.userName} ນີ້`;

    const confirm = await showConfirm(text, messageTranslation.SettingStatus);

    if (confirm) {
      let result;
      showProcessing();

      result = await updateActiveUser(acc.id, nextStatus);

      if (result.success) {
        showSuccess(result.message);
        reloadData();
      } else {
        showError(result.message);
      }
      closeProcessing;
    }
  };

  const showResetPasswordForm = async (user?: any) => {
    // Get existing warehouse IDs for the product

    const { value: formData } = await Swal.fire({
      title: edit(messageTranslation.ResetPassword),
      html: `
        <div style="text-align: left;">
           <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
             messageTranslation.UserName
           }</label>
          <input 
            id="swal-new-password" 
            class="swal2-input" 
            value="${user.userName || ""}"
            disabled
            style="margin-bottom: 15px; background-color: #f5f5f5; color: #888; cursor: not-allowed;"
          >
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">${
            messageTranslation.NewPassword
          }</label>
          <input 
            id="swal-new-password" 
            class="swal2-input" 
            placeholder=${messageTranslation.Placeholder}
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
        const newPassword = (
          document.getElementById("swal-new-password") as HTMLInputElement
        )?.value?.trim();
        if (!newPassword) {
          Swal.showValidationMessage(messageTranslation.AllFiledRequired);
          return false;
        }

        return {
          newPassword,
        };
      },
    });

    if (formData) {
      let result;
      showProcessing();

      result = await resetPassword(user.id, formData.newPassword);

      closeProcessing();

      if (result.success) {
        showSuccess(result.message);
        reloadData();
      } else {
        showError(result.message);
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
        <Link
          href={"/accounts/create"}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          {create(messageTranslation.Account)}
        </Link>
      </div>

      {/* Filter Card */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          {filter(messageTranslation.Account)}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={searchBy(messageTranslation.UserName)}
            value={search.userName}
            onChange={(e) => setSearch({ ...search, userName: e.target.value })}
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
          <div className="text-center py-10 text-gray-500">{"loading"}</div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No users found</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Stt}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.UserName}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.FullName}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.ActiveStatus}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {messageTranslation.Role}
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(
                (user: {
                  id: string;
                  userName: string;
                  stt: number;
                  fullName: string;
                  activeStatus: ActiveState;
                  role: Role;
                }) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.stt}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {user.userName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {user.fullName}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`font-medium ${
                          user.activeStatus === ActiveState.ACTIVE
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {activeStatusTranslation[user.activeStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.role}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {hasPermission(PermissionConst.USER_UPDATE) && (
                          <>
                            <Link
                              href={`/accounts/${user.id}/edit`}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200 transition"
                            >
                              <Edit size={14} />
                              {messageTranslation.Edit}
                            </Link>
                            <button
                              onClick={() => showResetPasswordForm(user)}
                              className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition"
                            >
                              <UserRoundCog size={14} />
                              {messageTranslation.ResetPassword}
                            </button>
                          </>
                        )}
                        {hasPermission(PermissionConst.USER_DELETE) && (
                          <button
                            onClick={() => handleActiveStatus(user)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition"
                          >
                            <UserRoundCog size={14} />
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
