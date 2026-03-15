import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllDrivers,
  deleteDriver,
  exportToExcelDrivers,
} from "../services/api";
import type { Driver } from "../types";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
};

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | undefined>(
    undefined,
  );
  const [isApproved, setIsApproved] = useState<boolean | undefined>(
    undefined,
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchDrivers();
  }, [page, limit, search, isAvailable, isApproved, fromDate, toDate]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAllDrivers({
        page,
        limit,
        search: search || undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        isApproved: isApproved !== undefined ? isApproved : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setDrivers(response.data.drivers);
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleAvailabilityChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    setIsAvailable(value === "all" ? undefined : value === "true");
    setPage(1);
  };

  const handleApprovalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setIsApproved(value === "all" ? undefined : value === "true");
    setPage(1);
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setError("");
      setExporting(true);
      const { blob, filename } = await exportToExcelDrivers({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: search || undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        isApproved: isApproved !== undefined ? isApproved : undefined,
      });
      downloadBlob(blob, filename || "drivers.xlsx");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1); // Reset to first page when changing limit
  };

  const handleRowClick = (driverId: string) => {
    navigate(`/drivers/${driverId}`);
  };

  const handleDelete = async (e: React.MouseEvent, driverId: string) => {
    e.stopPropagation(); // Prevent row click when clicking delete button

    if (!window.confirm("Are you sure you want to delete this driver?")) {
      return;
    }

    try {
      await deleteDriver(driverId);
      // Refresh the list after deletion
      fetchDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete driver");
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
        <p className="mt-1 text-sm text-gray-600">Total: {total}</p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search by name, phone, email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="sm:w-48">
              <label
                htmlFor="availability"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Availability
              </label>
              <select
                id="availability"
                value={
                  isAvailable === undefined ? "all" : isAvailable.toString()
                }
                onChange={handleAvailabilityChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
            <div className="sm:w-48">
              <label
                htmlFor="approval"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Account Status
              </label>
              <select
                id="approval"
                value={
                  isApproved === undefined ? "all" : isApproved.toString()
                }
                onChange={handleApprovalChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="true">Approved</option>
                <option value="false">Pending</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label
                htmlFor="driver-from"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                From date
              </label>
              <input
                id="driver-from"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-40"
              />
            </div>
            <div>
              <label
                htmlFor="driver-to"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                To date
              </label>
              <input
                id="driver-to"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-40"
              />
            </div>
            <button
              type="button"
              onClick={clearDateFilter}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear dates
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export to Excel"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading drivers...</div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registraion Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ambulances
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drivers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No drivers found
                      </td>
                    </tr>
                  ) : (
                    drivers.map((driver) => (
                      <tr
                        key={driver._id}
                        onClick={() => handleRowClick(driver._id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {driver.driverName || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {driver.phoneNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {driver.email || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {driver.driverLicenceNo || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(driver.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {driver.ambulances?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {driver.isApproved ? "Approved" : "Pending"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => handleDelete(e, driver._id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div className="mt-4 bg-white p-4 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Items per page:</span>
                  <select
                    value={limit}
                    onChange={handleLimitChange}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Showing {drivers.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
                    {Math.min(page * limit, total)} of {total} results
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {getPageNumbers().map((pageNum, index) => (
                    <React.Fragment key={index}>
                      {pageNum === "..." ? (
                        <span className="px-3 py-1 text-sm text-gray-700">
                          ...
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(pageNum as number)}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            page === pageNum
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )}
                    </React.Fragment>
                  ))}

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Drivers;
