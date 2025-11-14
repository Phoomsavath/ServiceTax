"use client";

type PaginationProps = {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  page: number;
  setPage: (page: number) => void;
  loading?: boolean;
};

export default function Pagination({
  pagination,
  page,
  setPage,
  loading = false,
}: PaginationProps) {
  if (loading || pagination.totalPages <= 1) return null;

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="text-sm text-gray-600">
        Showing page
        <span className="font-medium">{pagination.currentPage}</span> of
        <span className="font-medium">{pagination.totalPages}</span> (
        {pagination.totalItems} items)
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={!pagination.hasPrev}
          className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!pagination.hasNext}
          className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}
