// Currency utility functions for LKR formatting

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs. 0.00';
  }
  
  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Format with thousands separator and 2 decimal places
  return `Rs. ${numAmount.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Format currency without decimals for whole amounts
export const formatCurrencyWhole = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'Rs. 0';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // If it's a whole number, show without decimals
  if (numAmount % 1 === 0) {
    return `Rs. ${numAmount.toLocaleString('en-LK')}`;
  }
  
  return formatCurrency(numAmount);
};

// Parse currency input (remove Rs. and commas)
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remove 'Rs.', 'Rs', spaces, and commas
  const cleaned = currencyString.toString().replace(/Rs\.?|,|\s/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

// Format price for input fields
export const formatPriceInput = (amount) => {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount.toString();
};