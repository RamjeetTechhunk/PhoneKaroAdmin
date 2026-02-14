import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRideByOrderId } from '../services/api';
import type { RideDetailData } from '../types';
import Layout from '../components/Layout';
import ImageViewer from '../components/ImageViewer';

const RideDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [ride, setRide] = useState<RideDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchRideDetail();
    }
  }, [orderId]);

  const fetchRideDetail = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError('');
      const response = await getRideByOrderId(orderId);
      if (response.data && response.data.length > 0) {
        setRide(response.data[0]);
      } else {
        setError('Ride not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ride details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
      case 'inprogress':
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!orderId) return null;

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <button
            onClick={() => navigate('/rides')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Rides
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Ride Details</h1>
          <p className="mt-1 text-sm text-gray-600">Order ID: {orderId}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64 text-gray-500">
            Loading ride details...
          </div>
        ) : ride ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 space-y-6">
              {/* Order & Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order & Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order ID</label>
                    <p className="mt-1 text-sm text-gray-900">{ride.orderId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ride Status</label>
                    <p className="mt-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(ride.rideStatus)}`}>
                        {ride.rideStatus}
                      </span>
                    </p>
                  </div>
                  {ride.ridePin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ride PIN</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.ridePin}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(ride.createdAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Updated At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(ride.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{ride.patientDetails?.patientName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{ride.patientDetails?.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{ride.patientDetails?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Driver Details */}
              {ride.driverDetails && Object.keys(ride.driverDetails).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(ride.driverDetails).map(([key, value]) => {
                      if (value == null || String(value) === '') return null;
                      const strVal = String(value);
                      const isImageUrl = key.toLowerCase() === 'driverprofile' || (typeof value === 'string' && /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(strVal));
                      return (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          {isImageUrl ? (
                            <div className="mt-1 flex items-center gap-2">
                              <img
                                src={strVal}
                                alt="Driver Profile"
                                className="h-16 w-16 rounded-full object-cover border border-gray-200"
                              />
                              <button
                                onClick={() => setViewingImage({ url: strVal, title: 'Driver Profile' })}
                                className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                              >
                                View full size
                              </button>
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-gray-900">{strVal}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ambulance */}
              {ride.ambulance && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ambulance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.ambulance.AmbulanceType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.ambulance.vehicleNumber || 'N/A'}</p>
                    </div>
                    {ride.ambulance.description && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 text-sm text-gray-900">{ride.ambulance.description}</p>
                      </div>
                    )}
                    {ride.ambulance.image && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Image</label>
                        <button
                          onClick={() => setViewingImage({ url: ride.ambulance!.image!, title: 'Ambulance' })}
                          className="mt-1 text-sm text-indigo-600 hover:text-indigo-800 underline"
                        >
                          View Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Source */}
              {ride.source && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Source</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.source.address}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Latitude</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.source.lat}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Longitude</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.source.long}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Destination */}
              {ride.destination && ride.destination.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Destination(s)</h3>
                  <div className="space-y-4">
                    {ride.destination.map((dest, idx) => (
                      <div key={dest._id || idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <p className="mt-1 text-sm text-gray-900">{dest.address}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Latitude</label>
                            <p className="mt-1 text-sm text-gray-900">{dest.lat}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Longitude</label>
                            <p className="mt-1 text-sm text-gray-900">{dest.long}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fare & Payment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fare & Payment</h3>
                <div className="grid grid-cols-2 gap-4">
                  {ride.EstimatedFare != null && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estimated Fare</label>
                      <p className="mt-1 text-sm text-gray-900">₹{ride.EstimatedFare}</p>
                    </div>
                  )}
                  {ride.finalAmount != null && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Final Amount</label>
                      <p className="mt-1 text-sm text-gray-900">₹{ride.finalAmount}</p>
                    </div>
                  )}
                  {ride.paymentStatus != null && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.paymentStatus}</p>
                    </div>
                  )}
                  {ride.paymentMode != null && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Mode</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.paymentMode}</p>
                    </div>
                  )}
                  {ride.transactionId && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.transactionId}</p>
                    </div>
                  )}
                  {ride.couponDiscount != null && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Coupon Discount</label>
                      <p className="mt-1 text-sm text-gray-900">{ride.couponDiscount || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Discount */}
              {ride.discount && (ride.discount.coupon || ride.discount.value) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {ride.discount.coupon && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Coupon</label>
                        <p className="mt-1 text-sm text-gray-900">{ride.discount.coupon}</p>
                      </div>
                    )}
                    {ride.discount.value != null && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Value</label>
                        <p className="mt-1 text-sm text-gray-900">{ride.discount.value}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-500">No ride data available</p>
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

export default RideDetail;
