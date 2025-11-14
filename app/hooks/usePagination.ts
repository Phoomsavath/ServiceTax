import { useState, useEffect, useRef } from "react";
import { createApiWithAlert } from "@/lib/apiWithAlert";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Filters {
  [key: string]: any;
}

interface UsePaginatedDataResult<T = any> {
  items: T[];
  pagination: Pagination;
  loading: boolean;
  page: number;
  setPage: (p: number) => void;
  filters: Filters;
  applyFilters: (newFilters: Filters) => void;
  clearFilters: () => void;
  reloadData: () => void;
}

export function usePagination<T = any>(
  apiUrl: string,
  defaultFilters: Filters = {},
  defaultPage = 1,
  defaultLimit = 50
): UsePaginatedDataResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const api = createApiWithAlert();
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(defaultPage);
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const loadData = async (p = page, currentFilters = filters) => {
    setLoading(true);

    try {
      const params = {
        page: p,
        limit: defaultLimit,
        ...currentFilters,
      };

      const { data: dataRes } = await api.get(apiUrl, {
        params,
        withCredentials: true, // สำหรับ NextAuth cookie
      });

      if (dataRes.data) {
        setItems(dataRes.data);
        setPagination(dataRes.pagination);
        setLoading(false);
      } else {
        setItems([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
        });
      }
    } catch (err: any) {
      setItems([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        hasNext: false,
        hasPrev: false,
      });
      setLoading(false); // ← add this
    }
  };

  const applyFilters = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
    loadData(1, newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
    loadData(1, {});
  };

  const reloadData = () => loadData(page, filters);

  useEffect(() => {
    loadData(page, filters);
  }, [page, filters, apiUrl]);

  return {
    items,
    pagination,
    loading,
    page,
    setPage,
    filters,
    applyFilters,
    clearFilters,
    reloadData,
  };
}
