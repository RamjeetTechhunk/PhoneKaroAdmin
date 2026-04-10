import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRides, exportToExcelRidesReport, closeRide, updatePaymentStatus } from '../services/api';
import type { Ride } from '../types';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const Rides: React.FC = () => {
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [rideStatus, setRideStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [exporting, setExporting] = useState(false);
  const [closingRideId, setClosingRideId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchRides();
  }, [search, rideStatus, fromDate, toDate, page, limit]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError('');
      const params: {
        page?: number;
        limit?: number;
        search?: string;
        rideStatus?: string;
        fromDate?: string;
        toDate?: string;
      } = { page, limit };

      if (search) {
        params.search = search;
      }
      if (rideStatus) {
        params.rideStatus = rideStatus;
      }
      if (fromDate) {
        params.fromDate = fromDate;
      }
      if (toDate) {
        params.toDate = toDate;
      }

      const response = await getAllRides(params);
      const ridesData = response.data?.rides ?? response.data;
      setRides(Array.isArray(ridesData) ? ridesData : []);
      setTotal(response.data?.total ?? 0);
      setTotalPages(response.data?.totalPages ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRideStatus(e.target.value);
    setPage(1);
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value);
    setPage(1);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setRideStatus('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setError('');
      setExporting(true);
      const { blob, filename } = await exportToExcelRidesReport({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        search: search || undefined,
        rideStatus: rideStatus || undefined,
      });
      downloadBlob(blob, filename || 'rides-report.xlsx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleCloseRide = async (e: React.MouseEvent, ride: Ride) => {
    e.stopPropagation();
    if (!ride.driverId) {
      setError('Cannot close ride: no driver assigned');
      return;
    }
    if (!window.confirm(`Are you sure you want to close ride ${ride.orderId}?`)) {
      return;
    }
    try {
      setClosingRideId(ride._id);
      setError('');
      await closeRide(ride.orderId, ride.driverId);
      await fetchRides();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close ride');
    } finally {
      setClosingRideId(null);
    }
  };

  const handlePaymentStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, ride: Ride) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    if (!newStatus) return;
    try {
      setUpdatingPaymentId(ride._id);
      setError('');
      await updatePaymentStatus(ride.orderId, newStatus, ride.paymentMode || 'cash');
      await fetchRides();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment status');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const handlePaymentModeChange = async (e: React.ChangeEvent<HTMLSelectElement>, ride: Ride) => {
    e.stopPropagation();
    const newMode = e.target.value;
    if (!newMode) return;
    try {
      setUpdatingPaymentId(ride._id);
      setError('');
      await updatePaymentStatus(ride.orderId, ride.paymentStatus || 'unpaid', newMode);
      await fetchRides();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment mode');
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
      case 'inprogress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rides</h1>
        <p className="mt-1 text-sm text-gray-600">Total: {total}</p>
      </div>

      {/* Filters Section */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by order ID..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="rideStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Ride Status
            </label>
            <select
              id="rideStatus"
              value={rideStatus}
              onChange={handleStatusChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="ongoing">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="fromDate"
              value={fromDate}
              onChange={handleFromDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="toDate"
              value={toDate}
              onChange={handleToDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading rides...</div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Origin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rides.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                        No rides found
                      </td>
                    </tr>
                  ) : (
                    rides.map((ride) => (
                      <tr
                        key={ride._id}
                        onClick={() => navigate(`/rides/${encodeURIComponent(ride.orderId)}`)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ride.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                              ride.rideStatus ?? ''
                            )}`}
                          >
                            {ride.rideStatus ? ride.rideStatus.charAt(0).toUpperCase() + ride.rideStatus.slice(1) : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {ride.patientDetails?.patientName || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ride.patientDetails?.phoneNumber || 'N/A'}
                          </div>
                          {ride.patientDetails?.email && (
                            <div className="text-sm text-gray-500">{ride.patientDetails.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ride.driverDetails ? (
                            <div className="flex items-center">
                              {ride.driverDetails.driverProfile && (
                                <img
                                  src={ride.driverDetails.driverProfile}
                                  alt={ride.driverDetails.driverName ?? ''}
                                  className="h-8 w-8 rounded-full mr-2 object-cover"
                                />
                              )}
                              <div>
                                <div className="text-sm text-gray-900">
                                  {ride.driverDetails.driverName || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {ride.driverDetails.phoneNumber || 'N/A'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No driver assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px]">
                          <div className="truncate" title={ride.source?.address || ''}>
                            {ride.source?.address || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-[200px]">
                          <div className="truncate" title={ride.destination?.[0]?.address || ''}>
                            {ride.destination?.[0]?.address || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(ride.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={ride.paymentStatus || ''}
                            onChange={(e) => handlePaymentStatusChange(e, ride)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingPaymentId === ride._id}
                            className={`px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                              ride.paymentStatus === 'paid' ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
                            }`}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            value={ride.paymentMode || ''}
                            onChange={(e) => handlePaymentModeChange(e, ride)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={updatingPaymentId === ride._id}
                            className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="">N/A</option>
                            <option value="cash">Cash</option>
                            <option value="online">Online</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {ride.rideStatus?.toLowerCase() !== 'completed' &&
                           ride.rideStatus?.toLowerCase() !== 'cancelled' && (
                            <button
                              onClick={(e) => handleCloseRide(e, ride)}
                              disabled={closingRideId === ride._id}
                              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                              {closingRideId === ride._id ? 'Closing...' : 'Close'}
                            </button>
                          )}
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
                    Showing {rides.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
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
                      {pageNum === '...' ? (
                        <span className="px-3 py-1 text-sm text-gray-700">...</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(pageNum as number)}
                          className={`px-3 py-1 text-sm font-medium rounded-md ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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

export default Rides;
