import licenseSchema from '~/schema/license';
import type * as t from '~/types';

export function createLicenseModel(mongoose: typeof import('mongoose')) {
  return mongoose.models.License || mongoose.model<t.ILicense>('License', licenseSchema);
}
