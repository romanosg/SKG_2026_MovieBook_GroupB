// Basic email check: something@something.tld
export const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

// The three password rules
export const getPasswordRules = (value) => [
  { label: "At least 7 characters", met: value.length >= 7 },
  { label: "At least 1 capital letter", met: /[A-Z]/.test(value) },
  {
    label: "At least 1 number or special character",
    met: /[0-9]|[^A-Za-z0-9\s]/.test(value),
  },
];

export const isValidPassword = (value) =>
  getPasswordRules(value).every((rule) => rule.met);
