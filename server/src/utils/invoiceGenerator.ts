export const generateInvoicePDF = async (paymentData: any): Promise<string> => {
  // In a real app, this would use puppeteer or @react-pdf/renderer
  // and upload to Cloudinary.
  // For the scope of this project, we return a mock URL.
  return 'https://res.cloudinary.com/demo/image/upload/sample.pdf';
};
