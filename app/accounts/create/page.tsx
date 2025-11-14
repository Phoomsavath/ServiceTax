"use client";

import { useActionState, useEffect, useState } from "react";

import { useAlert } from "@/app/hooks/useAlert";
import { Role, Permission } from "@prisma/client";
import { useRouter } from "next/navigation";
import { initialState, messageTranslation } from "@/lib/constant";
import { createUser } from "@/action/users";
import { withPermission } from "@/components/withPermission";

function CreateAccountPage() {
  const [state, formAction] = useActionState(createUser, initialState);
  const { showSuccess, showError } = useAlert();
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    []
  );
  const router = useRouter();

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        showSuccess(state.message);
        router.back();
      } else {
        showError(state.message);
      }
    }
  }, [state, router]);

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

  // Define modules with their CRUD permissions
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

  const getActionFromPermission = (permission: string) => {
    const parts = permission.split("_");
    return parts[parts.length - 1];
  };

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
          <h2 className="text-2xl font-bold text-center text-gray-800">
            create
          </h2>
          <form
            className="mt-6"
            action={(formData) => {
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
                required
              />
            </div>
            {/* Password Input */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-600"
              >
                {messageTranslation.Password}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="w-full mt-2 p-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={messageTranslation.Placeholder}
                required
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
                className="w-full mt-2 p-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="" disabled>
                  -- {messageTranslation.Role} --
                </option>
                {Object.values(Role).map((role) => (
                  <option key={role} value={role}>
                    {role}
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
export default withPermission(CreateAccountPage, Permission.USER_CREATE);
