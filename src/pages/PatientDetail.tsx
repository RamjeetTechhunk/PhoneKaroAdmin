import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPatientById } from "../services/api";
import type { Patient } from "../types";
import Layout from "../components/Layout";

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      fetchPatientDetails();
    }
  }, [id]);

  const fetchPatientDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");
      const response = await getPatientById(id);
      // API returns an array with a single patient
      if (response.data && response.data.length > 0) {
        setPatient(response.data[0]);
      } else {
        setError("Patient not found");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch patient details",
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
              Back to Patients
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Patient Details
            </h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading patient details...</div>
          </div>
        ) : patient ? (
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
                      Patient ID
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{patient._id}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Patient Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.patientName || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.phoneNumber}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Alternate Phone
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.alternatePhoneNumber || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.email || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.gendar || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Reference Code
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.refCode || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Registration Date
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(patient.registerationDate)}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.address || "N/A"}
                    </p>
                  </div>

                  {patient.lat && patient.long && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Latitude
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {patient.lat}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Longitude
                        </label>
                        <p className="mt-1 text-sm text-gray-900">
                          {patient.long}
                        </p>
                      </div>
                    </>
                  )}

                  {patient.location && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Location Coordinates
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        Long: {patient.location.coordinates[0]}, Lat:{" "}
                        {patient.location.coordinates[1]}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Additional Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      User Type
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {patient.userType}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Notification ID
                    </label>
                    <p className="mt-1 text-sm text-gray-900 break-all">
                      {patient.notification_id || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Is Deleted
                    </label>
                    <p className="mt-1">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.isDeleted
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {patient.isDeleted ? "Yes" : "No"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

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
                      {formatDate(patient.createdAt)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Updated At
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(patient.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">No patient data available</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PatientDetail;
