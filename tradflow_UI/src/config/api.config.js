import { ENV } from "./environment";

export const API_BASE_URL = ENV.apiBaseUrl;

// Central registry of endpoint paths, grouped by feature. Keeps literal
// strings out of the *Api.js files so a backend route rename is a one-line fix.
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    refresh: "/auth/refresh",
  },
  // API_BASE_URL already ends with /api, so this resolves to /api/users.
  users: "/users",
  roles: "/roles",
  permissions: "/permissions",
  companies: "/companies",
  products: "/products",
  productMasters: "/product-masters",
  parties: "/parties",
  imports: "/imports",
  purchases: "/purchases",
  sales: "/sales",
  stock: "/stock",
};
