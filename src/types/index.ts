import type {
  Property,
  Listing,
  Landlord,
  User,
  Tenancy,
  TenancyTenant,
  Tenant,
  MaintenanceRequest,
  MaintenanceUpdate,
  Contractor,
} from '@prisma/client'

// ─── Re-export Prisma Enums ───────────────────────────────────────────────────

export {
  UserRole,
  PropertyType,
  PropertyTenure,
  PropertyStatus,
  ListingType,
  TenancyStatus,
  PaymentStatus,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
  InspectionType,
  InspectionStatus,
  ComplianceType,
  EnquirySource,
  ApplicantStage,
  FeeType,
  DocumentType,
  NotificationType,
  ReferencingStatus,
} from '@prisma/client'

// ─── Composite Property Type ──────────────────────────────────────────────────

export type PropertyWithListing = Property & {
  listing: Listing | null
  landlord: Landlord & { user: User }
}

// ─── Composite Tenancy Type ───────────────────────────────────────────────────

export type TenancyWithDetails = Tenancy & {
  property: Property
  tenants: (TenancyTenant & {
    tenant: Tenant & { user: User }
  })[]
  landlord: Landlord
}

// ─── Composite Maintenance Type ───────────────────────────────────────────────

export type MaintenanceWithContractor = MaintenanceRequest & {
  contractor: Contractor | null
  updates: MaintenanceUpdate[]
}

// ─── Dashboard Statistics ─────────────────────────────────────────────────────

export interface DashboardStats {
  /** Total properties in the portfolio */
  totalProperties: number
  /** Properties with AVAILABLE status */
  vacantProperties: number
  /** Total monthly rent roll in pence */
  totalRentRoll: number
  /** Total rent in arrears in pence */
  arrearsTotal: number
  /** Tenancies expiring within 30 days */
  upcomingRenewals30: number
  /** Tenancies expiring within 60 days */
  upcomingRenewals60: number
  /** Open (non-completed/cancelled) maintenance jobs */
  openMaintenanceJobs: number
  /** New enquiries received in the last 7 days */
  newEnquiriesThisWeek: number
  /** Viewings scheduled in the last 7 days */
  viewingsThisWeek: number
  /** Compliance items expiring within 60 days */
  expiringCompliance: number
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
}

// ─── API Response Helpers ─────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  details?: unknown
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ─── Filter/Search Types ──────────────────────────────────────────────────────

export interface PropertyFilters {
  listingType?: 'RENT' | 'SALE'
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  propertyType?: string[]
  area?: string
  postcode?: string
  availableFrom?: string
  furnished?: boolean
  petsAllowed?: boolean
  featured?: boolean
  limit?: number
  page?: number
  sort?: 'newest' | 'price_asc' | 'price_desc'
}

// ─── Area Guide ───────────────────────────────────────────────────────────────

export interface AreaGuide {
  slug: string
  displayName: string
  description: string[]
  transport: { name: string; type: 'tube' | 'overground' | 'elizabeth' | 'bus'; lines?: string[] }[]
  avgRent: { studio: number; oneBed: number; twoBed: number }
  vibe: string
  unsplashId: string
}
