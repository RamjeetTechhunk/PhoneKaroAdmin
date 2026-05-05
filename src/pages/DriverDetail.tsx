import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDriverById, updateDriverApprovalStatus } from "../services/api";
import type { Driver } from "../types";
import Layout from "../components/Layout";
import ImageViewer from "../components/ImageViewer";

const DriverDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewingImage, setViewingImage] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDriverDetails();
    }
  }, [id]);

  const fetchDriverDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");
      const response = await getDriverById(id);
      // API returns an array with a single driver
      if (response.data && response.data.length > 0) {
        setDriver(response.data[0]);
      } else {
        setError("Driver not found");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch driver details",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleApprovalStatusChange = async (isApproved: boolean) => {
    if (!driver || !id) return;

    try {
      setUpdating(true);
      setError("");
      await updateDriverApprovalStatus({
        id: id,
        isApproved: isApproved,
      });
      // Refresh driver details after approval status change
      await fetchDriverDetails();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update approval status",
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Layout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Drivers
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Driver Details
              </h1>
              {driver && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprovalStatusChange(true)}
                    disabled={updating || driver.isApproved}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      driver.isApproved
                        ? "bg-green-100 text-green-800 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updating ? "Updating..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleApprovalStatusChange(false)}
                    disabled={updating || !driver.isApproved}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      !driver.isApproved
                        ? "bg-red-100 text-red-800 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {updating ? "Updating..." : "Reject"}
                  </button>
                </div>
              )}
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
            <div className="text-gray-500">Loading driver details...</div>
          </div>
        ) : driver ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Driver ID
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{driver._id}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Driver Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {driver.driverName || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {driver.phoneNumber}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {driver.email || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Aadhar Number
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {driver.driverAadharNo || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      License Number
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {driver.driverLicenceNo || "N/A"}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {driver.address || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Account Status
                    </label>
                    <p className="mt-1">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          driver.isApproved
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {driver.isApproved ? "Approved" : "Pending"}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <p className="mt-1">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          driver.isAvailable
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {driver.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Active
                    </label>
                    <p className="mt-1">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          driver.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {driver.isActive ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>

                  {driver.lat && driver.long && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Latitude
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {driver.lat}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Longitude
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {driver.long}
                        </p>
                      </div>
                    </>
                  )}

                  {driver.location && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Location Coordinates
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        Long: {driver.location.coordinates[0]}, Lat:{" "}
                        {driver.location.coordinates[1]}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Details */}
              {driver.ownerDetails && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Owner Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Owner Name
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {driver.ownerDetails.ownerName || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Owner ID
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {driver.ownerDetails.ownerId || "N/A"}
                      </p>
                    </div>

                    {driver.ownerDetails.ownerFile && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Owner File
                        </label>
                        <button
                          onClick={() =>
                            setViewingImage({
                              url: driver.ownerDetails!.ownerFile!,
                              title: "Owner File",
                            })
                          }
                          className="mt-1 text-sm text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          View Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Documents
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {driver.driverProfile && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Profile Picture
                      </label>
                      <button
                        onClick={() =>
                          setViewingImage({
                            url: driver.driverProfile!,
                            title: "Driver Profile",
                          })
                        }
                        className="mt-1 text-sm text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        View Image
                      </button>
                    </div>
                  )}

                  {driver.driverAadharFile && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Aadhar File
                      </label>
                      <button
                        onClick={() =>
                          setViewingImage({
                            url: driver.driverAadharFile!,
                            title: "Aadhar File",
                          })
                        }
                        className="mt-1 text-sm text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        View Image
                      </button>
                    </div>
                  )}

                  {driver.driverLicenceFile && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        License File
                      </label>
                      <button
                        onClick={() =>
                          setViewingImage({
                            url: driver.driverLicenceFile!,
                            title: "License File",
                          })
                        }
                        className="mt-1 text-sm text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        View Image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Ambulances */}
              {driver.ambulances && driver.ambulances.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ambulances ({driver.ambulances.length})
                  </h3>
                  <div className="space-y-4">
                    {driver.ambulances.map((ambulance, index) => (
                      <div
                        key={ambulance._id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h4 className="font-medium text-gray-900 mb-2">
                          Ambulance {index + 1}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Type
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {ambulance.ambulanceType}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Ambulance No
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {ambulance.ambulanceNo}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Registration No
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {ambulance.registrationNo}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              RC No
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {ambulance.ambulanceRcNo}
                            </p>
                          </div>

                          {ambulance.ambulanceFile && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Ambulance Image
                              </label>
                              <button
                                onClick={() =>
                                  setViewingImage({
                                    url: ambulance.ambulanceFile,
                                    title: `Ambulance ${index + 1} Image`,
                                  })
                                }
                                className="mt-1 text-sm text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                              >
                                View Image
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Timestamps
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Created At
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(driver.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Updated At
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(driver.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">No driver data available</p>
          </div>
        )}

        {viewingImage && (
          <ImageViewer
            imageUrl={viewingImage.url}
            title={viewingImage.title}
            onClose={() => setViewingImage(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default DriverDetail;
