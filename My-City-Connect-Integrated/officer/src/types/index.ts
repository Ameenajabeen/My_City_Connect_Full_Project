/**
 * MY CITY CONNECT - Smart Civic Issue Management
 * Officer Web Dashboard Data Types
 */

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'AI_VERIFICATION'
  | 'VERIFIED'
  | 'DUPLICATE'
  | 'DEPARTMENT_ASSIGNED'
  | 'WORKER_ASSIGNED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'WORKER_ACCEPTED'
  | 'IN_PROGRESS'
  | 'WORKER_COMPLETED'
  | 'OFFICER_VERIFICATION'
  | 'REWORK'
  | 'RESOLVED'
  | 'CANCELLED'
  | 'CLOSED';

export type ComplaintPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ComplaintCategory =
  | 'Potholes'
  | 'Garbage accumulation'
  | 'Broken streetlights'
  | 'Water leakage'
  | 'Drainage problems'
  | 'Damaged roads'
  | 'Stray animals'
  | 'Other municipal issues'
  | string;

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  landmark?: string;
}

export interface StatusHistoryItem {
  id: string;
  status: ComplaintStatus;
  timestamp: string;
  changedBy?: string;
  actorRole?: 'CITIZEN' | 'OFFICER' | 'WORKER' | 'SYSTEM';
  comment?: string;
  proofImageUrl?: string;
}

export interface ComplaintFeedback {
  id: string;
  complaintId: string;
  citizenId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  title?: string;
  citizenId?: string;
  ward?: string;
  resolvedAt?: string;
  resolutionProofUrl?: string;
  ticketNumber?: string;
  category: ComplaintCategory;
  description: string;
  photoUrl?: string;
  completionProofUrl?: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  updatedAt?: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  departmentId?: string;
  departmentName?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignmentId?: string;
  assignmentStatus?: string;
  assignmentAcceptedAt?: string;
  citizenName?: string;
  citizenPhone?: string;
  citizenEmail?: string;
  statusHistory?: StatusHistoryItem[];
  feedbacks?: ComplaintFeedback[];
  resolutionNotes?: string;
  estimatedResolutionTimeHours?: number;
  estimatedResolutionHours?: number;
}

export type WorkerAvailability = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface Worker {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  departmentId: string;
  departmentName: string;
  availability: WorkerAvailability;
  latitude?: number;
  longitude?: number;
  currentAddress?: string;
  currentAssignmentId?: string;
  currentComplaintId?: string;
  currentComplaintTitle?: string;
  currentAssignmentStatus?: string;
  completedTasksCount: number;
  activeTasksCount?: number;
  employeeId?: string;
  preferredLocation?: string | null;
  averageResolutionTimeHours?: number;
  performanceScore?: number; // 0 to 100
  lastActiveTimestamp?: string;
  lastLocationUpdate?: string;
  avatarUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  headName?: string;
  contactEmail?: string;
  contactPhone?: string;
  activeComplaintsCount?: number;
  pendingComplaintsCount?: number;
  resolvedComplaintsCount?: number;
  availableWorkersCount?: number;
  totalWorkersCount?: number;
  averageResolutionTimeHours?: number;
  performanceScore?: number;
  totalComplaints?: number;
  resolvedComplaints?: number;
  activeWorkers?: number;
  totalWorkersCount?: number;
  efficiencyScore?: number;
}

export interface Assignment {
  id: string;
  complaintId: string;
  workerId: string;
  departmentId: string;
  assignedByOfficerId: string;
  assignedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export type RedZoneSeverity = 'CRITICAL' | 'HIGH' | 'WARNING';

export interface RedZone {
  id: string;
  name: string;
  complaintCount: number;
  highPriorityCount?: number;
  pendingCount?: number;
  mostCommonCategory?: string;
  topCategory?: string;
  affectedDepartment?: string;
  departmentName?: string;
  description?: string;
  ward?: string;
  severity: RedZoneSeverity;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters?: number;
  polygonCoordinates?: Array<{ lat: number; lng: number }>;
  activeWorkersDispatched?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationType =
  | 'NEW_COMPLAINT'
  | 'HIGH_PRIORITY_COMPLAINT'
  | 'WORKER_ASSIGNED'
  | 'WORKER_ACCEPTED'
  | 'WORKER_LOCATION_UPDATED'
  | 'COMPLAINT_IN_PROGRESS'
  | 'COMPLETION_PROOF_UPLOADED'
  | 'RESOLUTION_AWAITING_APPROVAL'
  | 'COMPLAINT_RESOLVED'
  | 'RED_ZONE_DETECTED';

export interface DashboardNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp?: string;
  createdAt?: string;
  priority?: ComplaintPriority;
  read: boolean;
  relatedComplaintId?: string;
  complaintId?: string;
  relatedWorkerId?: string;
}

export interface DashboardKPIData {
  totalComplaints: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  highPriorityComplaints: number;
  activeWorkers: number;
  totalWorkers?: number;
  activeRedZones?: number;
  resolutionRatePercentage?: number;
  averageResolutionTimeHours?: number;
  trends?: {
    totalTrend?: number;
    pendingTrend?: number;
    inProgressTrend?: number;
    resolvedTrend?: number;
    highPriorityTrend?: number;
    activeWorkersTrend?: number;
  };
}

export interface AnalyticsData {
  complaintsOverTime?: Array<{ date: string; count: number; resolved: number }>;
  trendsOverTime?: Array<{ date: string; complaints?: number; resolved?: number; count?: number }>;
  complaintsByCategory?: Array<{ category: string; count: number }>;
  categoryBreakdown?: Array<{ category: string; count: number }>;
  complaintsByDepartment?: Array<{ department: string; count: number; resolved?: number }>;
  departmentResolutionTimes?: Array<{ department: string; avgHours: number }>;
  resolutionRateTrend?: Array<{ period: string; rate: number }>;
  avgResolutionTimeByDept?: Array<{ department: string; hours: number }>;
  workerPerformanceList?: Array<{ name: string; department: string; resolved: number; score: number }>;
  wardPerformance?: Array<{ ward: string; score: number }>;
  redZoneTrends?: Array<{ zone: string; complaintCount: number; severity: RedZoneSeverity }>;
}

export interface OfficerUser {
  id: string;
  name: string;
  email: string;
  role: 'OFFICER' | 'MUNICIPAL_OFFICER' | 'ADMINISTRATOR' | 'SUPERVISOR' | 'DISPATCHER';
  departmentId?: string;
  departmentName?: string;
  badgeNumber?: string;
  token?: string;
  avatarUrl?: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  data?: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
