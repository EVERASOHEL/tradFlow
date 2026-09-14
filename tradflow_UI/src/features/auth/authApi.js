import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../services/api/apiClient";
import { API_ENDPOINTS } from "../../config/api.config";
import { setCredentials, setCurrentUser, loggedOut } from "./authSlice";

function unwrapApiEnvelope(payload) {
  if (!payload) {
    return payload;
  }

  return payload.responseObj ?? payload.data ?? payload;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["CurrentUser"],
  endpoints: (builder) => ({
    login: builder.mutation({
      // credentials: { email, password }
      query: (credentials) => ({
        url: API_ENDPOINTS.auth.login,
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        const { data: response } = await queryFulfilled;
        const data = unwrapApiEnvelope(response);
        dispatch(
          setCredentials({
            user: {
              id: data.userId ?? data.id,
              username: data.username,
              fullName: data.fullName,
              roles: Array.isArray(data.roles) ? data.roles : [],
              permissions: Array.isArray(data.permissions) ? data.permissions : [],
            },
            token: data.accessToken,
            refreshToken: data.refreshToken,
          })
        );
      },
      invalidatesTags: ["CurrentUser"],
    }),

    getCurrentUser: builder.query({
      query: () => API_ENDPOINTS.auth.me,
      providesTags: ["CurrentUser"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data: response } = await queryFulfilled;
        const payload = unwrapApiEnvelope(response);
        dispatch(setCurrentUser(payload));
      },
    }),

    logout: builder.mutation({
      query: () => ({
        url: API_ENDPOINTS.auth.logout,
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Clear the local session even if the server call fails — a user
          // asking to sign out should never be stuck signed in on this device.
          dispatch(loggedOut());
        }
      },
    }),

    forgotPassword: builder.mutation({
      // payload: { email }
      query: (payload) => ({
        url: API_ENDPOINTS.auth.forgotPassword,
        method: "POST",
        body: payload,
      }),
    }),

    resetPassword: builder.mutation({
      // payload: { token, password }
      query: (payload) => ({
        url: API_ENDPOINTS.auth.resetPassword,
        method: "POST",
        body: payload,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
