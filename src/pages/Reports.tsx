import React, { useEffect, useMemo, useState } from 'react';
import type { Driver } from '../types';
import {
  downloadDailyPatientReport,
  downloadDriverPatientReport,
  downloadDriverRevenueReport,
  downloadTotalPatientReport,
  getAllDriversList,
} from '../services/api';

const formatDateInput = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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

const Reports: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)), [today]);
  const defaultTo = useMemo(() => formatDateInput(today), [today]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [driverId, setDriverId] = useState('');

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);

  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<
    'driverPatient' | 'totalPatient' | 'driverRevenue' | 'dailyPatient' | null
  >(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setDriversLoading(true);
        const res = await getAllDriversList();
        setDrivers(res.data.drivers ?? []);
      } catch (err) {
        // Keep page usable even if drivers fail
        setError(err instanceof Error ? err.message : 'Failed to fetch drivers');
      } finally {
        setDriversLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const dateError =
    fromDate && toDate && new Date(fromDate) > new Date(toDate) ? 'From date cannot be after To date.' : '';

  const canDownloadCommon = Boolean(fromDate) && Boolean(toDate) && !dateError && !downloading;
  const canDownloadDriverPatient = canDownloadCommon && Boolean(driverId);

  const handleDownload = async (
    kind: 'driverPatient' | 'totalPatient' | 'driverRevenue' | 'dailyPatient'
  ) => {
    try {
      setError('');
      setDownloading(kind);

      const baseName = `${fromDate}_to_${toDate}`;
      if (kind === 'driverPatient') {
        if (!driverId) throw new Error('Please select a driver');
        const { blob, filename } = await downloadDriverPatientReport({ driverId, fromDate, toDate });
        downloadBlob(blob, filename || `driver_patient_${driverId}_${baseName}.csv`);
        return;
      }
      if (kind === 'totalPatient') {
        const { blob, filename } = await downloadTotalPatientReport({ fromDate, toDate });
        downloadBlob(blob, filename || `total_patient_${baseName}.csv`);
        return;
      }
      if (kind === 'driverRevenue') {
        const { blob, filename } = await downloadDriverRevenueReport({ fromDate, toDate });
        downloadBlob(blob, filename || `driver_revenue_${baseName}.csv`);
        return;
      }

      const { blob, filename } = await downloadDailyPatientReport({ fromDate, toDate });
      downloadBlob(blob, filename || `daily_patient_${baseName}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-600">
            From <span className="font-medium">{fromDate || '—'}</span> to{' '}
            <span className="font-medium">{toDate || '—'}</span>
            {driverId ? (
              <>
                {' '}
                • Driver: <span className="font-medium">{driverId}</span>
              </>
            ) : null}
          </p>
        </div>

        <button
          onClick={() => setIsFilterOpen(true)}
          className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Show Filters
        </button>
      </div>

      {(error || dateError) && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{dateError || error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <button
          disabled={!canDownloadDriverPatient}
          onClick={() => handleDownload('driverPatient')}
          className={`rounded-lg border p-4 text-left shadow-sm transition-colors ${
            canDownloadDriverPatient ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'
          }`}
        >
          <div className="text-sm font-medium text-gray-900">Driver Patient Report</div>
          <div className="mt-1 text-xs text-gray-500">Requires driver + dates</div>
          <div className="mt-3 text-sm font-medium">
            {downloading === 'driverPatient' ? 'Downloading...' : 'Download'}
          </div>
        </button>

        <button
          disabled={!canDownloadCommon}
          onClick={() => handleDownload('totalPatient')}
          className={`rounded-lg border p-4 text-left shadow-sm transition-colors ${
            canDownloadCommon ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'
          }`}
        >
          <div className="text-sm font-medium text-gray-900">Total Patient Report</div>
          <div className="mt-1 text-xs text-gray-500">Dates only</div>
          <div className="mt-3 text-sm font-medium">
            {downloading === 'totalPatient' ? 'Downloading...' : 'Download'}
          </div>
        </button>

        <button
          disabled={!canDownloadCommon}
          onClick={() => handleDownload('driverRevenue')}
          className={`rounded-lg border p-4 text-left shadow-sm transition-colors ${
            canDownloadCommon ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'
          }`}
        >
          <div className="text-sm font-medium text-gray-900">Driver Revenue Report</div>
          <div className="mt-1 text-xs text-gray-500">Dates only</div>
          <div className="mt-3 text-sm font-medium">
            {downloading === 'driverRevenue' ? 'Downloading...' : 'Download'}
          </div>
        </button>

        <button
          disabled={!canDownloadCommon}
          onClick={() => handleDownload('dailyPatient')}
          className={`rounded-lg border p-4 text-left shadow-sm transition-colors ${
            canDownloadCommon ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'
          }`}
        >
          <div className="text-sm font-medium text-gray-900">Daily Patient Report</div>
          <div className="mt-1 text-xs text-gray-500">Dates only</div>
          <div className="mt-3 text-sm font-medium">
            {downloading === 'dailyPatient' ? 'Downloading...' : 'Download'}
          </div>
        </button>
      </div>

      {/* Filter Sidebar */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50">
          <button
            onClick={() => setIsFilterOpen(false)}
            className="absolute inset-0 bg-black/30"
            aria-label="Close filters overlay"
          />

          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <p className="text-xs text-gray-500">Set date range and driver (optional).</p>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">From date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">To date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Driver</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">All / Not selected</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.driverName || d.phoneNumber || d._id}
                    </option>
                  ))}
                </select>
                {driversLoading && (
                  <div className="mt-2 text-xs text-gray-500">Loading drivers...</div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setFromDate(defaultFrom);
                    setToDate(defaultTo);
                    setDriverId('');
                  }}
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

