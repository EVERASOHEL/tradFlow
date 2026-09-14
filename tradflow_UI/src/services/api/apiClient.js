import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../config/api.config";
import { APP_CONFIG } from "../../config/app.config";
import storageService from "../storage/storageService";
import { sessionExpired } from "../../features/auth/authSlice";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = storageService.get(APP_CONFIG.tokenStorageKey);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Wraps the base query so that any 401 anywhere in the app clears the stored
// session and routes the user back to login, instead of every feature having
// to handle that case individually.
export async function baseQueryWithReauth(args, api, extraOptions) {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    api.dispatch(sessionExpired());
  }

  return result;
}
