// ============================================
// CHECKER HELPER FUNCTIONS
// ============================================
import { RecordStatus } from '../types/mockDb';

/**
 * Returns professional CSS classes for status badges
 */
export const getStatusBadgeClass = (status: RecordStatus): string => {
  switch (status) {
    case RecordStatus.DISCREPANT:
      return 'status-badge discrepant';
    case RecordStatus.APPROVED:
      return 'status-badge approved';
    case RecordStatus.REJECTED:
      return 'status-badge rejected';
    default:
      return 'status-badge pending';
  }
};

/**
 * Validates if the module can proceed to printing phase
 */
export const canSubmitForPrinting = (totalDiscrepantCount: number): boolean => {
  return totalDiscrepantCount === 0;
};
