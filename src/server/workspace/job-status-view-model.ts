import type { JobRecord } from '@/domain/canonical/job';
import {
  mapJobRecordToStatusViewModel,
  type JobStatusViewModel,
} from '@/domain/workspace/job-status-display';

export function mapPersistedJobToStatusViewModel(job: JobRecord): JobStatusViewModel {
  return mapJobRecordToStatusViewModel(job);
}
