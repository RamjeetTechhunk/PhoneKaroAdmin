import type {
  LoginRequest,
  LoginResponse,
  PatientsResponse,
  DriversResponse,
  PatientDetailResponse,
  DriverDetailResponse,
  RidesResponse,
  RideDetailResponse,
  AmbulanceType,
  FareRateItem,
  Coupon,
  CouponsResponse,
  CouponDetailResponse,
} from '../types';

const API_BASE_URL = 'https://api.gyankunjkutir.com/api/v1';
const ROOT_API_URL = "https://api.gyankunjkutir.com/api/v1";

// Get token from localStorage
export const getToken = (): string | null => {
  return localStorage.getItem('admin_token');
};

// Set token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('admin_token', token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('admin_token');
};

// Helper function to make API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// Helper for root (non-/api/v1) endpoints like coupons
const rootApiCall = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${ROOT_API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// Login API
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiCall<LoginResponse>('/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (response.data?.token) {
    setToken(response.data.token);
  }

  return response;
};

// Get all patients
export const getAllPatients = async (params?: {
  fromDate?: string;
  toDate?: string;
}): Promise<PatientsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.fromDate) queryParams.append('fromDate', params.fromDate);
  if (params?.toDate) queryParams.append('toDate', params.toDate);
  const qs = queryParams.toString();
  return apiCall<PatientsResponse>(`/patient/getAllPatient${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
};

// Get patient by ID
export const getPatientById = async (id: string): Promise<PatientDetailResponse> => {
  return apiCall<PatientDetailResponse>(`/patient/getpatientById?id=${id}`, {
    method: 'GET',
  });
};

// Get all drivers
export const getAllDrivers = async (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    isAvailable?: boolean;
    isApproved?: boolean;
    fromDate?: string;
    toDate?: string;
  }
): Promise<DriversResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  }
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.isAvailable !== undefined) {
    queryParams.append('isAvailable', params.isAvailable.toString());
  }
  if (params?.isApproved !== undefined) {
    queryParams.append('isApproved', params.isApproved.toString());
  }
  if (params?.fromDate) {
    queryParams.append('fromDate', params.fromDate);
  }
  if (params?.toDate) {
    queryParams.append('toDate', params.toDate);
  }

  const queryString = queryParams.toString();
  const endpoint = `/driver/getAllDrivers${queryString ? `?${queryString}` : ''}`;

  return apiCall<DriversResponse>(endpoint, {
    method: 'GET',
  });
};

// Get all drivers list (non-paginated usage)
export const getAllDriversList = async (): Promise<DriversResponse> => {
  return getAllDrivers({ page: 1, limit: 1000 });
};

// Get driver by ID
export const getDriverById = async (id: string): Promise<DriverDetailResponse> => {
  return apiCall<DriverDetailResponse>(`/driver/getdriverById?id=${id}`, {
    method: 'GET',
  });
};

// --- Reports (file downloads) ---
const getFilenameFromContentDisposition = (value: string | null): string | null => {
  if (!value) return null;
  // Supports: attachment; filename="x.csv" OR filename*=UTF-8''x.csv
  const filenameStarMatch = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1].trim());
    } catch {
      return filenameStarMatch[1].trim();
    }
  }
  const filenameMatch = value.match(/filename\s*=\s*"?([^"]+)"?/i);
  return filenameMatch?.[1]?.trim() ?? null;
};

const fetchReportBlob = async (
  url: string
): Promise<{ blob: Blob; filename: string | null }> => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    try {
      const parsed = JSON.parse(text) as { message?: string };
      throw new Error(parsed?.message || 'Request failed');
    } catch {
      throw new Error(text || 'Request failed');
    }
  }

  const blob = await response.blob();
  const filename = getFilenameFromContentDisposition(response.headers.get('content-disposition'));
  return { blob, filename };
};

export const downloadDriverPatientReport = async (params: {
  driverId: string;
  fromDate: string;
  toDate: string;
}) => {
  const qs = new URLSearchParams({
    driverId: params.driverId,
    fromDate: params.fromDate,
    toDate: params.toDate,
  }).toString();
  return fetchReportBlob(`${ROOT_API_URL}/report/driver-patient?${qs}`);
};

export const downloadTotalPatientReport = async (params: { fromDate: string; toDate: string }) => {
  const qs = new URLSearchParams({
    fromDate: params.fromDate,
    toDate: params.toDate,
  }).toString();
  return fetchReportBlob(`${ROOT_API_URL}/report/total-patient?${qs}`);
};

export const downloadDriverRevenueReport = async (params: { fromDate: string; toDate: string }) => {
  const qs = new URLSearchParams({
    fromDate: params.fromDate,
    toDate: params.toDate,
  }).toString();
  return fetchReportBlob(`${ROOT_API_URL}/report/driver-revenue?${qs}`);
};

export const downloadDailyPatientReport = async (params: { fromDate: string; toDate: string }) => {
  const qs = new URLSearchParams({
    fromDate: params.fromDate,
    toDate: params.toDate,
  }).toString();
  return fetchReportBlob(`${API_BASE_URL}/report/daily-patient?${qs}`);
};

// --- Export to Excel ---
export const exportToExcelPatient = async (params?: { fromDate?: string; toDate?: string }) => {
  const qs = new URLSearchParams();
  if (params?.fromDate) qs.append('fromDate', params.fromDate);
  if (params?.toDate) qs.append('toDate', params.toDate);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return fetchReportBlob(`${ROOT_API_URL}/report/export-to-excel-patient${suffix}`);
};

export const exportToExcelDrivers = async (params?: {
  fromDate?: string;
  toDate?: string;
  search?: string;
  isAvailable?: boolean;
  isApproved?: boolean;
}) => {
  const qs = new URLSearchParams();
  if (params?.fromDate) qs.append('fromDate', params.fromDate);
  if (params?.toDate) qs.append('toDate', params.toDate);
  if (params?.search) qs.append('search', params.search);
  if (params?.isAvailable !== undefined) qs.append('isAvailable', String(params.isAvailable));
  if (params?.isApproved !== undefined) qs.append('isApproved', String(params.isApproved));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return fetchReportBlob(`${ROOT_API_URL}/report/export-to-excel-drivers${suffix}`);
};

export const exportToExcelRidesReport = async (params?: {
  fromDate?: string;
  toDate?: string;
  search?: string;
  rideStatus?: string;
}) => {
  const qs = new URLSearchParams();
  if (params?.fromDate) qs.append('fromDate', params.fromDate);
  if (params?.toDate) qs.append('toDate', params.toDate);
  if (params?.search) qs.append('search', params.search);
  if (params?.rideStatus) qs.append('rideStatus', params.rideStatus);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return fetchReportBlob(`${ROOT_API_URL}/report/export-to-excel-rides-report${suffix}`);
};

// --- Coupons ---

export interface AddCouponRequest {
  code: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
}

export interface UpdateCouponRequest {
  id: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
  isActive?: boolean;
}

export const getAllCoupons = async (): Promise<CouponsResponse> => {
  return rootApiCall<CouponsResponse>('/coupon/getAllCoupons', {
    method: 'GET',
  });
};

export const getCouponById = async (id: string): Promise<CouponDetailResponse> => {
  return rootApiCall<CouponDetailResponse>(`/coupon/getCouponById?id=${id}`, {
    method: 'GET',
  });
};

export const addCoupon = async (body: AddCouponRequest): Promise<CouponDetailResponse> => {
  return rootApiCall<CouponDetailResponse>('/coupon/addCoupon', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const updateCoupon = async (body: UpdateCouponRequest): Promise<CouponDetailResponse> => {
  return rootApiCall<CouponDetailResponse>('/coupon/updateCoupon', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

export const deleteCoupon = async (id: string): Promise<{ code: number; message: string; data?: Coupon }> => {
  return rootApiCall<{ code: number; message: string; data?: Coupon }>('/coupon/deleteCoupon', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
};

// Update driver approval status
export interface UpdateDriverApprovalRequest {
  id: string;
  isApproved: boolean;
}

export interface UpdateDriverApprovalResponse {
  code: number;
  message: string;
  data?: any;
}

export const updateDriverApprovalStatus = async (
  request: UpdateDriverApprovalRequest
): Promise<UpdateDriverApprovalResponse> => {
  return apiCall<UpdateDriverApprovalResponse>('/driver/updateDriverApprovalstatus', {
    method: 'PUT',
    body: JSON.stringify(request),
  });
};

// Get all rides
export const getAllRides = async (
  params?: {
    search?: string;
    rideStatus?: string;
    fromDate?: string;
    toDate?: string;
  }
): Promise<RidesResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.rideStatus) {
    queryParams.append('rideStatus', params.rideStatus);
  }
  if (params?.fromDate) {
    queryParams.append('fromDate', params.fromDate);
  }
  if (params?.toDate) {
    queryParams.append('toDate', params.toDate);
  }

  const queryString = queryParams.toString();
  const endpoint = `/rideOrder/getAllRides${queryString ? `?${queryString}` : ''}`;

  return apiCall<RidesResponse>(endpoint, {
    method: 'GET',
  });
};

// Get ride by order ID (full detail)
export const getRideByOrderId = async (orderId: string): Promise<RideDetailResponse> => {
  return apiCall<RideDetailResponse>(
    `/rideOrder/getRideStatus?orderId=${encodeURIComponent(orderId)}`,
    { method: 'GET' }
  );
};

// Delete patient
export interface DeleteResponse {
  code: number;
  message: string;
  data?: any;
}

export const deletePatient = async (id: string): Promise<DeleteResponse> => {
  return apiCall<DeleteResponse>(`/patient/deletepatient?id=${id}`, {
    method: 'DELETE',
  });
};

// Delete driver
export const deleteDriver = async (id: string): Promise<DeleteResponse> => {
  return apiCall<DeleteResponse>(`/driver/deletedriver?id=${id}`, {
    method: 'DELETE',
  });
};

// --- Ambulance Types ---

export interface AmbulanceTypesListResponse {
  code: number;
  message: string;
  data: AmbulanceType[] | { ambulanceTypes?: AmbulanceType[]; list?: AmbulanceType[]; total?: number };
}

export const getAllAmbulanceTypes = async (
  params?: { pageNo?: number; pageSize?: number }
): Promise<AmbulanceTypesListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.pageNo !== undefined) queryParams.append('pageNo', params.pageNo.toString());
  if (params?.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
  const qs = queryParams.toString();
  return apiCall<AmbulanceTypesListResponse>(
    `/ambulanceType/getAllambulanceType${qs ? `?${qs}` : ''}`,
    { method: 'GET' }
  );
};

export interface AddAmbulanceTypeRequest {
  name: string;
  slug: string;
  baseFare: string;
  fareRate: FareRateItem[];
  description?: string;
  image?: string;
}

export const addAmbulanceType = async (
  body: AddAmbulanceTypeRequest
): Promise<DeleteResponse> => {
  return apiCall<DeleteResponse>('/ambulanceType/addAmbulanceType', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export interface UpdateAmbulanceTypeRequest {
  id: string;
  baseFare?: string;
  fareRate?: FareRateItem[];
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
}

export const updateAmbulanceType = async (
  body: UpdateAmbulanceTypeRequest
): Promise<DeleteResponse> => {
  return apiCall<DeleteResponse>('/ambulanceType/updateAmbulanceType', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

export interface ToggleAmbulanceTypeRequest {
  id: string;
  isDeleted: boolean;
}

export const toggleAmbulanceType = async (
  body: ToggleAmbulanceTypeRequest
): Promise<DeleteResponse> => {
  return apiCall<DeleteResponse>('/ambulanceType/toggleAmbulanceType', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};
