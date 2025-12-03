"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Plus, Minus, X, Package } from "lucide-react";
import { useAlert } from "@/app/hooks/useAlert";
import { formatCurrency } from "@/lib/getCurrencySymbol";
import { useApiWithAlert } from "@/lib/apiWithAlert";
import {
  CategoryTranslation,
  create,
  messageTranslation,
  PaidStatusTranslation,
  searchBy,
} from "@/lib/constant";
import { Category, InvoiceType, PaidType } from "@prisma/client";
import { createSaleInvoice } from "@/action/saleInvoice";

interface CreateInvoiceFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
  type: InvoiceType;
}

interface CartItem {
  id: number;
  serviceId: number;
  name: string;
  cost: number;
  price: number;
  quantity: number;
  details?: string;
}

export default function CreateSaleInvoiceForm({
  onCancel,
  onSuccess,
  type,
}: CreateInvoiceFormProps) {
  const {
    showError,
    showSuccess,
    showWarning,
    closeProcessing,
    showProcessing,
  } = useAlert();
  // States
  const [services, setServices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const api = useApiWithAlert();
  const [deliveryPoint, setDeliveryPoint] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [selectedPaidStatus, setSelectedPaidStatus] = useState<PaidType>(
    PaidType.UNPAID
  );
  const [selectedSet, setSelectedSet] = useState<string>(""); // New state for selected set

  useEffect(() => {
    const company = companies.find((c) => c.id === Number(selectedCompany));
    if (company) {
      setDeliveryPoint(company.address);
    }
  }, [selectedCompany]);

  useEffect(() => {
    loadServices();
    loadCompanies();
  }, []); // Add selectedSet to dependencies

  const loadServices = async () => {
    try {
      const { data } = await api.get(`/services`);

      setServices(data.success ? data.data : []);
    } catch (error) {
      setServices([]);
    }
  };
  const filteredServices = services.filter((service) => {
    const matchCategory =
      !selectedCategory || service.category === selectedCategory;

    return matchCategory;
  });
  const loadCompanies = async () => {
    const { data: companies } = await api.get("/companies");
    const companiesRes = companies?.data || [];
    setCompanies(companiesRes);
  };

  // Get unique sets from all services
  const getAvailableSets = () => {
    const setsSet = new Set<string>();
    services.forEach((service) => {
      if (Array.isArray(service.sets)) {
        service.sets.forEach((set: string) => setsSet.add(set));
      }
    });
    return Array.from(setsSet).sort();
  };

  const addToCart = (service: any) => {
    const existingItem = cart.find((item) => item.serviceId === service.id);

    const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

    if (existingItem) {
      updateQuantity(service.id, newQuantity);
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        serviceId: service.id,
        name: service.name,
        price: service.price || 0,
        cost: service.cost || 0,
        quantity: 1,
        details: "",
      };
      setCart([...cart, newItem]);
    }
  };

  // Add all services from selected set to cart
  const addSetToCart = () => {
    if (!selectedSet) {
      showWarning("Please select a set first");
      return;
    }

    const servicesInSet = services.filter(
      (service) =>
        Array.isArray(service.sets) && service.sets.includes(selectedSet)
    );

    if (servicesInSet.length === 0) {
      showWarning("No services found in this set");
      return;
    }

    // Create new cart items for services not already in cart
    const newItems: CartItem[] = [];
    const updatedCart = [...cart];

    servicesInSet.forEach((service, index) => {
      const existingItemIndex = updatedCart.findIndex(
        (item) => item.serviceId === service.id
      );

      if (existingItemIndex >= 0) {
        // If item exists, increment quantity
        updatedCart[existingItemIndex].quantity += 1;
      } else {
        // If item doesn't exist, create new item with unique ID
        newItems.push({
          id: Date.now() + index, // Add index to make IDs unique
          serviceId: service.id,
          name: service.name,
          price: service.price || 0,
          cost: service.cost || 0,
          quantity: 1,
          details: "",
        });
      }
    });

    // Combine updated cart with new items
    setCart([...updatedCart, ...newItems]);
  };

  const updateQuantity = (serviceId: number, newQuantity: number) => {
    if (newQuantity <= 0) return;

    setCart(
      cart.map((item) =>
        item.serviceId === serviceId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showWarning("ກະລຸນາເພີ່ມສິນຄ້າລົງກະຕ່າ");
      return;
    }

    const saleData = {
      deliveryPoint: deliveryPoint.trim(),
      companyId: parseInt(selectedCompany),
      status: selectedPaidStatus,
      type: type,
      items: cart.map((item) => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        details: item.details,
      })),
    };
    showProcessing();
    const result = await createSaleInvoice(saleData);
    closeProcessing();
    if (result?.success) {
      showSuccess(result?.message);
      clearCart();
      setSelectedCompany("");
      onSuccess?.();
      onCancel();
    } else {
      showError(result?.message);
    }
  };
  const updateDetails = (id: number, details: string) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, details: details } : item
      )
    );
  };

  const updatePrice = (id: number, newPrice: number) => {
    setCart(
      cart.map((item) => (item.id === id ? { ...item, price: newPrice } : item))
    );
  };

  const updateCost = (id: number, newCost: number) => {
    setCart(
      cart.map((item) => (item.id === id ? { ...item, cost: newCost } : item))
    );
  };

  const totalAmount = calculateTotal();
  const availableSets = getAvailableSets();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Side - Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Filters */}
        <div className="bg-white border-b p-4">
          <button
            onClick={onCancel}
            className="text-sm text-gray-600 hover:text-blue-600 mb-2 flex items-center gap-1"
          >
            ← {messageTranslation.Back}
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="text-blue-600" />
            {create(
              type === InvoiceType.INVOICE
                ? messageTranslation.Invoice
                : messageTranslation.Quotation
            )}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {messageTranslation.Category}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- All Categories --</option>

                {Object.values(Category).map((c) => (
                  <option key={c} value={c}>
                    {CategoryTranslation[c]}
                  </option>
                ))}
              </select>
            </div>
            {/* Filter by Set */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {messageTranslation.Set}
              </label>
              <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- All Sets --</option>
                {availableSets.map((set) => (
                  <option key={set} value={set}>
                    {set}
                  </option>
                ))}
              </select>
            </div>

            {/* Add Set Button */}
            <div className="flex items-end">
              <button
                onClick={addSetToCart}
                disabled={!selectedSet}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add Entire Set to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => addToCart(service)}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-4 cursor-pointer transition hover:shadow-md hover:border-blue-500"
              >
                <div className="flex flex-col h-full">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                    {service.name}
                  </h3>

                  {/* Display Sets */}

                  <div className="mt-auto">
                    <p className="text-sm text-gray-600 mb-1">
                      {messageTranslation.Price}:{" "}
                      {formatCurrency(service.price)}
                    </p>
                    <div className="flex items-center justify-end">
                      <Plus size={16} className="text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="w-full md:w-96 bg-white border-l flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b space-y-3 max-h-[50vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={24} className="text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">
                {messageTranslation.Cart} ({cart.length})
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                {messageTranslation.Delete}
              </button>
            )}
          </div>

          {/* Delivery Point */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {messageTranslation.DeliveryPoint} *
            </label>
            <input
              type="text"
              value={deliveryPoint}
              onChange={(e) => setDeliveryPoint(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              placeholder="ສະຖານທີ່ສົ່ງສິນຄ້າ"
            />
          </div>

          {/* Paid Status */}
          {type === InvoiceType.INVOICE && (
            <div>
              <label className="block text-sm font-medium text-gray-600">
                {messageTranslation.PaidStatus}
              </label>
              <select
                value={selectedPaidStatus}
                onChange={(e) =>
                  setSelectedPaidStatus(e.target.value as PaidType)
                }
                className="w-full mt-2 p-3 border border-gray-300 text-black rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="" disabled>
                  -- {messageTranslation.PaidStatus} --
                </option>
                {Object.values(PaidType).map((p) => (
                  <option key={p} value={p}>
                    {PaidStatusTranslation[p]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Company Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {messageTranslation.Company} *
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            >
              <option value="" disabled>
                -- {messageTranslation.Company} --
              </option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart size={64} className="mb-4" />
              <p>{messageTranslation.NoData}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm">
                        {item.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-600 w-16">
                      {messageTranslation.Quantity}:
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.serviceId, item.quantity - 1)
                      }
                      className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 transition"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.serviceId,
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-16 text-center border border-gray-300 rounded py-1 text-sm"
                      min="1"
                    />
                    <button
                      onClick={() =>
                        updateQuantity(item.serviceId, item.quantity + 1)
                      }
                      className="w-7 h-7 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {/* Details Input */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-600 w-16">
                      {messageTranslation.Details}:
                    </span>
                    <input
                      type="text"
                      value={item.details}
                      placeholder="Ex: 4072ອພ,7085ກງ"
                      onChange={(e) => updateDetails(item.id, e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Cost Input */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-600 w-16">
                      {messageTranslation.Cost}:
                    </span>
                    <input
                      type="number"
                      value={item.cost}
                      onChange={(e) =>
                        updateCost(item.id, parseFloat(e.target.value) || 0)
                      }
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Price Input */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-600 w-16">
                      {messageTranslation.Price}:
                    </span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updatePrice(item.id, parseFloat(e.target.value) || 0)
                      }
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-gray-600">
                      {messageTranslation.Total}
                    </span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{messageTranslation.TotalAmount}:</span>
              <span className="font-semibold">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {messageTranslation.Create}
          </button>
        </div>
      </div>
    </div>
  );
}
