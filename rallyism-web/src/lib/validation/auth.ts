export type AuthActionState = {
  error: string;
};

export const initialAuthActionState: AuthActionState = {
  error: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 6;

export function validateEmail(email: string) {
  if (!email) {
    return "Email is required.";
  }

  if (!emailPattern.test(email)) {
    return "Enter a valid email address.";
  }

  return "";
}

export function validateLoginInput(input: { email: string; password: string }) {
  const emailError = validateEmail(input.email);

  if (emailError) {
    return emailError;
  }

  if (!input.password) {
    return "Password is required.";
  }

  return "";
}

export function validateRegisterInput(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  if (!input.name.trim()) {
    return "Name is required.";
  }

  const emailError = validateEmail(input.email);

  if (emailError) {
    return emailError;
  }

  if (!input.password) {
    return "Password is required.";
  }

  if (input.password.length < minimumPasswordLength) {
    return `Password must be at least ${minimumPasswordLength} characters.`;
  }

  if (input.password !== input.confirmPassword) {
    return "Passwords do not match.";
  }

  return "";
}

export function validateForgotPasswordInput(input: { email: string }) {
  return validateEmail(input.email);
}

export function validateResetPasswordInput(input: {
  password: string;
  confirmPassword: string;
}) {
  if (!input.password) {
    return "Password is required.";
  }

  if (input.password.length < minimumPasswordLength) {
    return `Password must be at least ${minimumPasswordLength} characters.`;
  }

  if (input.password !== input.confirmPassword) {
    return "Passwords do not match.";
  }

  return "";
}

export function getSafeRedirectPath(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}
