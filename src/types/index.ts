export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    // Add other fields if present in the response
  };
}

export interface Patient {
  _id: string;
  patientName: string | null;
  email: string | null;
  phoneNumber: string;
  alternatePhoneNumber: string | null;
  address: string | null;
  userType: string;
  gendar: string | null;
  lat: string | null;
  long: string | null;
  registerationDate: string | null;
  refCode: string | null;
  deviceToken: string | null;
  isDeleted: boolean;
  notification_id: string | null;
  otp: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  location?: {
    type: string;
    coordinates: number[];
  };
}

export interface PatientsResponse {
  code: number;
  message: string;
  data: Patient[];
}

export interface Driver {
  _id: string;
  driverName: string | null;
  email: string | null;
  phoneNumber: string;
  driverAadharNo: string | null;
  driverProfile: string | null;
  driverAadharFile: string | null;
  driverLicenceNo: string | null;
  driverLicenceFile: string | null;
  address: string | null;
  lat: number | null;
  long: number | null;
  isAvailable: boolean;
  deviceToken: string | null;
  isDeleted: boolean;
  isActive: boolean;
  notification_id: string | null;
  ambulances: Ambulance[];
  createdAt: string;
  isApproved:boolean;
  updatedAt: string;
  __v: number;
  location?: {
    type: string;
    coordinates: number[];
  };
  ownerDetails?: {
    ownerName: string | null;
    ownerId: string | null;
    ownerFile: string | null;
  };
}

export interface Ambulance {
  _id: string;
  ambulanceType: string;
  registrationNo: string;
  registrationFile: string;
  ambulanceRcNo: string;
  ambulanceRcFile: string;
  ambulanceNo: string;
  ambulanceFile: string;
}

export interface DriversResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    drivers: Driver[];
  };
}

export interface PatientDetailResponse {
  code: number;
  message: string;
  data: Patient[];
}

export interface DriverDetailResponse {
  code: number;
  message: string;
  data: Driver[];
}

export interface DriverDetails {
  driverName: string;
  email: string;
  phoneNumber: string;
  driverProfile: string;
  location?: {
    type: string;
    coordinates: number[];
  };
}

export interface PatientDetails {
  patientName: string;
  email: string;
  phoneNumber: string;
}

export interface Ride {
  _id: string;
  rideStatus: string;
  orderId: string;
  createdAt: string;
  driverDetails?: DriverDetails;
  patientDetails: PatientDetails;
}

export interface RidesResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    rides: Ride[];
  };
}

// Ride Detail (from getRideStatus)
export interface RideDestination {
  _id?: string;
  address: string;
  lat: string;
  long: string;
}

export interface RideDetailData {
  _id: string;
  patientId?: string;
  driverId?: string;
  ambulance?: {
    AmbulanceType: string;
    vehicleNumber: string;
    discription?: string;
    image?: string;
  };
  source?: {
    address: string;
    lat: string;
    long: string;
  };
  destination?: RideDestination[];
  ridePin?: string;
  rideStatus: string;
  discount?: {
    coupon: string | null;
    value: string | null;
  };
  EstimatedFare?: string;
  couponDiscount?: string | null;
  finalAmount?: string;
  paymentStatus?: string;
  paymentMode?: string;
  transactionId?: string | null;
  isDeleted?: boolean;
  orderId: string;
  createdAt: string;
  updatedAt: string;
  driverDetails?: Record<string, unknown>;
  patientDetails: {
    _id?: string;
    patientName: string;
    email: string;
    phoneNumber: string;
  };
}

export interface RideDetailResponse {
  code: number;
  message: string;
  data: RideDetailData[];
}

// Ambulance Type (for sidebar Ambulance management)
export interface FareRateItem {
  range: string;
  rate: string;
}

export interface AmbulanceType {
  _id: string;
  name: string;
  slug: string;
  baseFare: string;
  fareRate: FareRateItem[];
  discription?: string;
  image?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AmbulanceTypesResponse {
  code: number;
  message: string;
  data: AmbulanceType[] | { ambulanceTypes: AmbulanceType[]; total?: number };
}

// Coupons
export interface Coupon {
  _id: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT' | string;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CouponsResponse {
  code: number;
  message: string;
  data: Coupon[];
}

export interface CouponDetailResponse {
  code: number;
  message: string;
  data: Coupon[]; // backend returns an array
}
