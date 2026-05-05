import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAllPatients, deletePatient, exportToExcelPatient } from '../services/api';
import type { Patient } from '../types';

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

const Patients: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState(searchParams.get('fromDate') || '');
  const [toDate, setToDate] = useState(searchParams.get('toDate') || '');
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  // Sync filters to URL search params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    setSearchParams(params, { replace: true });
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchPatients();
  }, [fromDate, toDate]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getAllPatients({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      let list = response.data || [];
      if (fromDate || toDate) {
        list = list.filter((p) => {
          const dateStr = p.createdAt || p.registerationDate;
          if (!dateStr) return false;
          const date = new Date(dateStr);
          if (fromDate && date < new Date(fromDate)) return false;
          if (toDate && date > new Date(toDate + 'T23:59:59.999Z')) return false;
          return true;
        });
      }
      setPatients(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
  };

  const handleExport = async () => {
    try {
      setError('');
      setExporting(true);
      const { blob, filename } = await exportToExcelPatient({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      downloadBlob(blob, filename || 'patients.xlsx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleRowClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleDelete = async (e: React.MouseEvent, patientId: string) => {
    e.stopPropagation(); // Prevent row click when clicking delete button
    
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      await deletePatient(patientId);
      // Refresh the list after deletion
      fetchPatients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete patient');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
        <p className="mt-1 text-sm text-gray-600">Total: {patients.length}</p>
      </div>

      {/* Date filter */}
      <div className="mb-4 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="patient-from" className="block text-sm font-medium text-gray-700 mb-1">
              From date
            </label>
            <input
              id="patient-from"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-40"
            />
          </div>
          <div>
            <label htmlFor="patient-to" className="block text-sm font-medium text-gray-700 mb-1">
              To date
            </label>
            <input
              id="patient-to"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
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
          <div className="text-gray-500">Loading patients...</div>
        </div>
      ) : (
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
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ref Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.map((patient) => (
                  <tr
                    key={patient._id}
                    onClick={() => handleRowClick(patient._id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {patient.patientName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.gendar || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(patient.registerationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.refCode || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => handleDelete(e, patient._id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Patients;
