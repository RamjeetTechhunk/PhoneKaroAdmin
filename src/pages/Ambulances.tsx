import React, { useEffect, useState } from 'react';
import {
  getAllAmbulanceTypes,
  addAmbulanceType,
  updateAmbulanceType,
  toggleAmbulanceType,
} from '../services/api';
import type { AmbulanceType, FareRateItem } from '../types';

function normalizeList(res: { data: AmbulanceType[] | { ambulanceTypes?: AmbulanceType[]; list?: AmbulanceType[]; total?: number } }): AmbulanceType[] {
  const d = res.data;
  if (Array.isArray(d)) return d;
  return (d as { ambulanceTypes?: AmbulanceType[] }).ambulanceTypes ?? (d as { list?: AmbulanceType[] }).list ?? [];
}

const defaultFareRate: FareRateItem[] = [{ range: '', rate: '' }];

const Ambulances: React.FC = () => {
  const [list, setList] = useState<AmbulanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [pageSize] = useState(10);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<AmbulanceType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toggleId, setToggleId] = useState<string | null>(null);

  // Add form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [baseFare, setBaseFare] = useState('');
  const [fareRate, setFareRate] = useState<FareRateItem[]>(defaultFareRate);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const fetchList = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAllAmbulanceTypes({ pageNo, pageSize });
      setList(normalizeList(res));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ambulance types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [pageNo, pageSize]);

  const openAdd = () => {
    setName('');
    setSlug('');
    setBaseFare('');
    setFareRate([...defaultFareRate]);
    setDescription('');
    setImage('');
    setAddOpen(true);
  };

  const openEdit = (item: AmbulanceType) => {
    setEditItem(item);
    setName(item.name);
    setSlug(item.slug);
    setBaseFare(item.baseFare ?? '');
    setFareRate(
      item.fareRate?.length
        ? item.fareRate.map((f) => ({ range: f.range, rate: f.rate }))
        : [...defaultFareRate]
    );
    setDescription(item.description ?? '');
    setImage(item.image ?? '');
  };

  const closeModals = () => {
    setAddOpen(false);
    setEditItem(null);
  };

  const addFareRateRow = () => {
    setFareRate((prev) => [...prev, { range: '', rate: '' }]);
  };

  const removeFareRateRow = (index: number) => {
    setFareRate((prev) => prev.filter((_, i) => i !== index));
  };

  const updateFareRate = (index: number, field: 'range' | 'rate', value: string) => {
    setFareRate((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const validFareRate = fareRate.filter((f) => f.range.trim() && f.rate.trim());
    if (!name.trim() || !slug.trim() || !baseFare.trim() || validFareRate.length === 0) {
      setError('Name, slug, base fare and at least one fare rate are required.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');
      await addAmbulanceType({
        name: name.trim(),
        slug: slug.trim(),
        baseFare: baseFare.trim(),
        fareRate: validFareRate,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
      });
      closeModals();
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ambulance type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const validFareRate = fareRate.filter((f) => f.range.trim() && f.rate.trim());
    try {
      setSubmitting(true);
      setError('');
      await updateAmbulanceType({
        id: editItem._id,
        baseFare: baseFare.trim() || undefined,
        fareRate: validFareRate.length ? validFareRate : undefined,
        name: name.trim() || undefined,
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        image: image.trim() || undefined,
      });
      closeModals();
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ambulance type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item: AmbulanceType) => {
    try {
      setToggleId(item._id);
      setError('');
      await toggleAmbulanceType({
        id: item._id,
        isDeleted: !item.isDeleted,
      });
      fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle status');
    } finally {
      setToggleId(null);
    }
  };

  const fareRateSummary = (rates: FareRateItem[] | undefined) => {
    if (!rates?.length) return '—';
    return rates.map((r) => `${r.range}: ${r.rate}`).join('; ');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ambulance Types</h1>
          <p className="mt-1 text-sm text-gray-600">Total: {list.length}</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
        >
          Add Ambulance Type
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64 text-gray-500">
          Loading...
        </div>
      ) : (
        <>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Fare</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fare Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No ambulance types found
                      </td>
                    </tr>
                  ) : (
                    list.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.slug}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.baseFare}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={fareRateSummary(item.fareRate)}>
                          {fareRateSummary(item.fareRate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.isDeleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {item.isDeleted ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(item)}
                            disabled={toggleId === item._id}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            {toggleId === item._id ? '...' : item.isDeleted ? 'Activate' : 'Deactivate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPageNo((p) => Math.max(1, p - 1))}
              disabled={pageNo <= 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {pageNo}</span>
            <button
              type="button"
              onClick={() => setPageNo((p) => p + 1)}
              disabled={list.length < pageSize}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Add Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Ambulance Type</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare *</label>
                  <input
                    type="text"
                    value={baseFare}
                    onChange={(e) => setBaseFare(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Fare Rate *</label>
                    <button type="button" onClick={addFareRateRow} className="text-sm text-indigo-600">
                      + Add row
                    </button>
                  </div>
                  <div className="space-y-2">
                    {fareRate.map((row, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="e.g. 0-5 km"
                          value={row.range}
                          onChange={(e) => updateFareRate(index, 'range', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="e.g. 10/km"
                          value={row.rate}
                          onChange={(e) => updateFareRate(index, 'rate', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeFareRateRow(index)}
                          className="text-red-600 p-1"
                          disabled={fareRate.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Ambulance Type</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare</label>
                  <input
                    type="text"
                    value={baseFare}
                    onChange={(e) => setBaseFare(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Fare Rate</label>
                    <button type="button" onClick={addFareRateRow} className="text-sm text-indigo-600">
                      + Add row
                    </button>
                  </div>
                  <div className="space-y-2">
                    {fareRate.map((row, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="e.g. 0-5 km"
                          value={row.range}
                          onChange={(e) => updateFareRate(index, 'range', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="e.g. 10/km"
                          value={row.rate}
                          onChange={(e) => updateFareRate(index, 'rate', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeFareRateRow(index)}
                          className="text-red-600 p-1"
                          disabled={fareRate.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ambulances;
