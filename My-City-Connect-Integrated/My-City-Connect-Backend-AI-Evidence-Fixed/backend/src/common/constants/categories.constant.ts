import { ComplaintCategory, ComplaintPriority } from '../enums';

export interface CategoryMetadata {
  code: ComplaintCategory;
  displayName: string;
  defaultDepartmentCode: string;
  defaultDepartmentName: string;
  basePriority: ComplaintPriority;
  slaHours: number;
}

export const CATEGORY_DEFINITIONS: Record<ComplaintCategory, CategoryMetadata> = {
  [ComplaintCategory.POTHOLE]: {
    code: ComplaintCategory.POTHOLE,
    displayName: 'Pothole & Asphalt Crater',
    defaultDepartmentCode: 'PWD',
    defaultDepartmentName: 'Roads & Infrastructure Maintenance (PWD)',
    basePriority: ComplaintPriority.HIGH,
    slaHours: 24,
  },
  [ComplaintCategory.DAMAGED_ROAD]: {
    code: ComplaintCategory.DAMAGED_ROAD,
    displayName: 'Damaged Road / Cave-in',
    defaultDepartmentCode: 'PWD',
    defaultDepartmentName: 'Roads & Infrastructure Maintenance (PWD)',
    basePriority: ComplaintPriority.HIGH,
    slaHours: 48,
  },
  [ComplaintCategory.STREETLIGHT]: {
    code: ComplaintCategory.STREETLIGHT,
    displayName: 'Streetlight Not Working / Broken Pole',
    defaultDepartmentCode: 'ELEC',
    defaultDepartmentName: 'Electrical Engineering & Street Lighting',
    basePriority: ComplaintPriority.MEDIUM,
    slaHours: 24,
  },
  [ComplaintCategory.GARBAGE]: {
    code: ComplaintCategory.GARBAGE,
    displayName: 'Garbage Dump / Overflowing Bin',
    defaultDepartmentCode: 'SWM',
    defaultDepartmentName: 'Solid Waste Management & Sanitation',
    basePriority: ComplaintPriority.MEDIUM,
    slaHours: 12,
  },
  [ComplaintCategory.WATER_LEAKAGE]: {
    code: ComplaintCategory.WATER_LEAKAGE,
    displayName: 'Water Pipeline Burst / Leakage',
    defaultDepartmentCode: 'WTR',
    defaultDepartmentName: 'Metro Water Supply & Sewerage Board',
    basePriority: ComplaintPriority.HIGH,
    slaHours: 12,
  },
  [ComplaintCategory.DRAINAGE]: {
    code: ComplaintCategory.DRAINAGE,
    displayName: 'Open Manhole / Overflowing Drainage',
    defaultDepartmentCode: 'DRG',
    defaultDepartmentName: 'Storm Water Drainage & Sewerage Operations',
    basePriority: ComplaintPriority.CRITICAL,
    slaHours: 6,
  },
  [ComplaintCategory.STRAY_ANIMAL]: {
    code: ComplaintCategory.STRAY_ANIMAL,
    displayName: 'Stray Cattle / Aggressive Animals',
    defaultDepartmentCode: 'VET',
    defaultDepartmentName: 'Public Health & Animal Welfare Division',
    basePriority: ComplaintPriority.LOW,
    slaHours: 48,
  },
  [ComplaintCategory.PUBLIC_PROPERTY_DAMAGE]: {
    code: ComplaintCategory.PUBLIC_PROPERTY_DAMAGE,
    displayName: 'Public Property / Bus Shelter / Park Damage',
    defaultDepartmentCode: 'GEN',
    defaultDepartmentName: 'Municipal Works & Civil Infrastructure',
    basePriority: ComplaintPriority.MEDIUM,
    slaHours: 72,
  },
  [ComplaintCategory.OTHER]: {
    code: ComplaintCategory.OTHER,
    displayName: 'Other Civic Grievance',
    defaultDepartmentCode: 'GEN',
    defaultDepartmentName: 'General Municipal Administration',
    basePriority: ComplaintPriority.LOW,
    slaHours: 48,
  },
};
