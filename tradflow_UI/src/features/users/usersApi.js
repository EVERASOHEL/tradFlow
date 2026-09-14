import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../services/api/apiClient";
import { API_ENDPOINTS } from "../../config/api.config";

const unwrapApiEnvelope = (payload) => payload?.responseObj ?? payload?.data ?? payload;

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: () => API_ENDPOINTS.users,
      transformResponse: unwrapApiEnvelope,
      providesTags: (result) => [
        { type: "User", id: "LIST" },
        ...(Array.isArray(result) ? result : result?.content ?? []).map((user) => ({
          type: "User",
          id: user.id,
        })),
      ],
    }),
    getUser: builder.query({
      query: (id) => `${API_ENDPOINTS.users}/${id}`,
      transformResponse: unwrapApiEnvelope,
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: API_ENDPOINTS.users, method: "POST", body }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ENDPOINTS.users}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `${API_ENDPOINTS.users}/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, active }) => ({
        url: `${API_ENDPOINTS.users}/${id}/status`,
        method: "PUT",
        body: { active },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
    assignRole: builder.mutation({
      query: ({ id, roleId }) => ({
        url: `${API_ENDPOINTS.users}/${id}/roles`,
        method: "POST",
        body: { roleId },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useAssignRoleMutation,
} = usersApi;