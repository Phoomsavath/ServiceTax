"use client";

import React, { use, useActionState, useEffect, useState } from "react";
import { Permission, Role } from "@prisma/client";
import { useApiWithAlert } from "@/lib/apiWithAlert";
import { useRouter } from "next/navigation";
import {
  initialState,
  messageTranslation,
  PermissionConst,
  RoleTranslation,
} from "@/lib/constant";
import { updateUser } from "@/action/users";
import { useAlert } from "@/app/hooks/useAlert";
import { withPermission } from "@/components/withPermission";

function EditAccountPage({ params }: any) {
  const unwrappedParams = use(params);
  const { id }: any = unwrappedParams;
  const router = useRouter();
  const api = useApiWithAlert();
  const [state, formAction] = useActionState(updateUser, initialState);
  const { showError, showProcessing, showSuccess, closeProcessing } =
    useAlert();
  const [formUser, setFormUser] = useState({
    userName: "",
    role: "",
    fullName: "",
  });

  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    []
  );

  useEffect(() => {
    const fetchAccount = async () => {
      if (!id) return; // Guard clause

      try {
        showProcessing();
        const { data: account } = await api.get(`/accounts/${id}`);
        closeProcessing();
        const accountRes = account.data;

        setFormUser({
          userName: accountRes.userName ?? "",
          role: accountRes.role ?? "",
          fullName: accountRes.fullName ?? "",
        });

        // Load existing permissions
        if (accountRes.permissions) {
          const perms = Array.isArray(accountRes.permissions)
            ? accountRes.permissions
            : JSON.parse(accountRes.permissions as string);
          setSelectedPermissions(perms);
        }
      } catch (error: any) {
        router.back();
      }
    };

    fetchAccount();
  }, [id, router]);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        showSuccess(state.message);
        router.back();
      } else {
        showError(state.message);
      }
    }
  }, [state]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePermission = (permission: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const isPermissionSelected = (permission: Permission) => {
    return selectedPermissions.includes(permission);
  };

  const modules = [
    {
      name: "User",
      permissions: ["USER_CREATE", "USER_VIEW", "USER_UPDATE", "USER_DELETE"],
    },

    {
      name: "Company",
      permissions: [
        "COMPANY_CREATE",
        "COMPANY_VIEW",
        "COMPANY_UPDATE",
        "COMPANY_DELETE",
      ],
    },

    {
      name: "Bill",
      permissions: ["BILL_CREATE", "BILL_VIEW", "BILL_UPDATE", "BILL_DELETE"],
    },

    {
      name: "Sale Invoice",
      permissions: [
        "SALE_INVOICE_CREATE",
        "SALE_INVOICE_VIEW",
        "SALE_INVOICE_UPDATE",
        "SALE_INVOICE_DELETE",
      ],
    },

    {
      name: "Service",
      permissions: [
        "SERVICE_CREATE",
        "SERVICE_VIEW",
        "SERVICE_UPDATE",
        "SERVICE_DELETE",
      ],
    },
  ];

  const selectAllForModule = (moduleName: string, permissions: string[]) => {
    const allSelected = permissions.every((p) =>
      selectedPermissions.includes(p as Permission)
    );

    if (allSelected) {
      setSelectedPermissions((prev) =>
        prev.filter((p) => !permissions.includes(p))
      );
    } else {
      const newPerms = permissions.filter(
        (p) => !selectedPermissions.includes(p as Permission)
      );
      setSelectedPermissions((prev) => [
        ...prev,
        ...(newPerms as Permission[]),
      ]);
    }
  };

  return (
    <div className="relative flex items-center justify-center p-4 overflow-hidden">
      <div className="flex justify-center items-center w-full">
        <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-md">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-blue-600 mb-2 flex items-center gap-1"
          >
            ← {messageTranslation.Back}
          </button>
          <h2 className="text-2xl font-bold text-center text-gray-800">
            {messageTranslation.Account}
          </h2>

          <form
            className="mt-6"
            action={(formData) => {
              formData.set("id", id);
              formData.set("permissions", JSON.stringify(selectedPermissions));
              return formAction(formData);
            }}
          >
            {/* User Name Input */}
            <div className="mb-4">
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-600"
              >
                {messageTranslation.UserName}
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formUser.userName}
                onChange={handleChange}
                className="w-full mt-2 p-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={messageTranslation.Placeholder}
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-600"
              >
                {messageTranslation.FullName}
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="w-full mt-2 p-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={messageTranslation.Placeholder}
                value={formUser.fullName}
                onChange={handleChange}
              />
            </div>

            {/* Role Select */}
            <div className="mb-4">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-600"
              >
                {messageTranslation.Role}
              </label>
              <select
                id="role"
                name="role"
                value={formUser.role}
                onChange={handleChange}
                className="w-full mt-2 p-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>
                  -- {messageTranslation.Role} --
                </option>
                {Object.values(Role).map((role) => (
                  <option key={role} value={role}>
                    {RoleTranslation[role]}
                  </option>
                ))}
              </select>
            </div>

            {/* Permissions CRUD Checklist */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-3">
                Permissions ({selectedPermissions.length} selected)
              </label>
              <div className="border border-gray-300 rounded-md overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-6 gap-2 bg-gray-100 p-3 font-semibold text-sm text-gray-700 border-b border-gray-300">
                  <div className="col-span-2">Module</div>
                  <div className="text-center">Create</div>
                  <div className="text-center">View</div>
                  <div className="text-center">Update</div>
                  <div className="text-center">Delete</div>
                </div>

                {/* Modules */}
                <div className="max-h-96 overflow-y-auto">
                  {modules.map((module, idx) => {
                    const allSelected = module.permissions.every((p) =>
                      selectedPermissions.includes(p as Permission)
                    );

                    return (
                      <div
                        key={module.name}
                        className={`grid grid-cols-6 gap-2 p-3 items-center ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-indigo-50 transition-colors`}
                      >
                        <div className="col-span-2 flex items-center">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={() =>
                              selectAllForModule(
                                module.name,
                                module.permissions
                              )
                            }
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 mr-2"
                          />
                          <span className="font-medium text-gray-800">
                            {module.name}
                          </span>
                        </div>

                        {/* CREATE */}
                        <div className="text-center">
                          {module.permissions.some((p) =>
                            p.includes("_CREATE")
                          ) ? (
                            <input
                              type="checkbox"
                              checked={isPermissionSelected(
                                module.permissions.find((p) =>
                                  p.includes("_CREATE")
                                ) as Permission
                              )}
                              onChange={() =>
                                togglePermission(
                                  module.permissions.find((p) =>
                                    p.includes("_CREATE")
                                  ) as Permission
                                )
                              }
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>

                        {/* VIEW */}
                        <div className="text-center">
                          {module.permissions.some((p) =>
                            p.includes("_VIEW")
                          ) ? (
                            <input
                              type="checkbox"
                              checked={isPermissionSelected(
                                module.permissions.find((p) =>
                                  p.includes("_VIEW")
                                ) as Permission
                              )}
                              onChange={() =>
                                togglePermission(
                                  module.permissions.find((p) =>
                                    p.includes("_VIEW")
                                  ) as Permission
                                )
                              }
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>

                        {/* UPDATE */}
                        <div className="text-center">
                          {module.permissions.some((p) =>
                            p.includes("_UPDATE")
                          ) ? (
                            <input
                              type="checkbox"
                              checked={isPermissionSelected(
                                module.permissions.find((p) =>
                                  p.includes("_UPDATE")
                                ) as Permission
                              )}
                              onChange={() =>
                                togglePermission(
                                  module.permissions.find((p) =>
                                    p.includes("_UPDATE")
                                  ) as Permission
                                )
                              }
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>

                        {/* DELETE */}
                        <div className="text-center">
                          {module.permissions.some((p) =>
                            p.includes("_DELETE")
                          ) ? (
                            <input
                              type="checkbox"
                              checked={isPermissionSelected(
                                module.permissions.find((p) =>
                                  p.includes("_DELETE")
                                ) as Permission
                              )}
                              onChange={() =>
                                togglePermission(
                                  module.permissions.find((p) =>
                                    p.includes("_DELETE")
                                  ) as Permission
                                )
                              }
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {messageTranslation.Submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default withPermission(EditAccountPage, PermissionConst.USER_UPDATE);
