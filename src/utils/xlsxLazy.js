let xlsxInstance = null;

export const getXLSX = async () => {
  if (!xlsxInstance) {
    xlsxInstance = await import('xlsx-js-style');
  }
  return xlsxInstance;
};
