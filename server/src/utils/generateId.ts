import crypto from 'crypto';

export const generateBookingId = (): string => {
  const year = new Date().getFullYear();
  const random = crypto.randomInt(1000, 9999);
  return `FY-${year}-${random}`;
};

export const generateComplaintId = (): string => {
  const year = new Date().getFullYear();
  const random = crypto.randomInt(1000, 9999);
  return `CMP-${year}-${random}`;
};

export const generateInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const random = crypto.randomInt(1000, 9999);
  return `INV-${year}-${random}`;
};

export const generateReferralCode = (): string => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};
