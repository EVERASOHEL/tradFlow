import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../services/api/apiClient";
import { API_ENDPOINTS } from "../../config/api.config";

const unwrapApiEnvelope = (payload) => payload?.responseObj ?? payload?.data ?? payload;

export const accessApi = createApi({
  reducerPath: "accessApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Role", "Permission"],
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: () => API_ENDPOINTS.roles,
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Role", id: "LIST" }],
    }),
    getRole: builder.query({
      query: (id) => `${API_ENDPOINTS.roles}/${id}`,
      transformResponse: unwrapApiEnvelope,
      providesTags: (_result, _error, id) => [{ type: "Role", id }],
    }),
    createRole: builder.mutation({
      query: (body) => ({ url: API_ENDPOINTS.roles, method: "POST", body }),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({ url: `${API_ENDPOINTS.roles}/${id}`, method: "PUT", body }),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),
    deactivateRole: builder.mutation({
      query: (id) => ({ url: `${API_ENDPOINTS.roles}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),
    assignPermission: builder.mutation({
      query: ({ id, permissionId }) => ({ url: `${API_ENDPOINTS.roles}/${id}/permissions`, method: "POST", body: { permissionId } }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Role", id }, { type: "Role", id: "LIST" }],
    }),
    getPermissions: builder.query({
      query: () => API_ENDPOINTS.permissions,
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Permission", id: "LIST" }],
    }),
    getPermission: builder.query({
      query: (id) => `${API_ENDPOINTS.permissions}/${id}`,
      transformResponse: unwrapApiEnvelope,
      providesTags: (_result, _error, id) => [{ type: "Permission", id }],
    }),
    createPermission: builder.mutation({
      query: (body) => ({ url: API_ENDPOINTS.permissions, method: "POST", body }),
      invalidatesTags: [{ type: "Permission", id: "LIST" }],
    }),
    updatePermission: builder.mutation({
      query: ({ id, ...body }) => ({ url: `${API_ENDPOINTS.permissions}/${id}`, method: "PUT", body }),
      invalidatesTags: [{ type: "Permission", id: "LIST" }],
    }),
    deactivatePermission: builder.mutation({
      query: (id) => ({ url: `${API_ENDPOINTS.permissions}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Permission", id: "LIST" }],
    }),
  }),
});

export const {
  useGetRolesQuery, useGetRoleQuery, useCreateRoleMutation, useUpdateRoleMutation,
  useDeactivateRoleMutation, useAssignPermissionMutation, useGetPermissionsQuery,
  useGetPermissionQuery, useCreatePermissionMutation, useUpdatePermissionMutation,
  useDeactivatePermissionMutation,
} = accessApi;