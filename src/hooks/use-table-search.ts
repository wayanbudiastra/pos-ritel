"use client";

import { useMemo, useState } from "react";

// Search + pagination client-side untuk tabel yang datanya sudah dibatasi
// ke 100 baris terakhir dari server (lihat masing-masing service `list*`).
// Default 10 baris/halaman sesuai kebutuhan seluruh tabel di aplikasi ini.
export function useTableSearch<T>(
  data: T[],
  searchFn?: (row: T, query: string) => boolean,
  pageSize = 10,
) {
  const [query, setQueryState] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchFn) return data;
    return data.filter((row) => searchFn(row, q));
  }, [data, query, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  function setQuery(value: string) {
    setQueryState(value);
    setPage(1);
  }

  return {
    query,
    setQuery,
    page: currentPage,
    setPage,
    totalPages,
    pageRows,
    totalFiltered: filtered.length,
  };
}
