import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../services/api/apiClient";
import { API_ENDPOINTS } from "../../config/api.config";

const unwrapApiEnvelope = (payload) => payload?.responseObj ?? payload?.data ?? payload?.content ?? payload;

const normalizeCompanyPage = (payload) => {
  const records = unwrapApiEnvelope(payload);
  const count = Number(payload?.count ?? payload?.total ?? payload?.totalElements ?? records.length ?? 0);
  return {
    records: Array.isArray(records) ? records : [],
    totalCount: Number.isFinite(count) ? count : 0,
  };
};

export const companiesApi = createApi({
  reducerPath: "companiesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Company"],
  endpoints: (builder) => ({
    getCompanies: builder.query({
      query: ({ page = 0, size = 50, company = "", state = "", city = "" } = {}) => ({
        url: API_ENDPOINTS.companies,
        params: {
          page,
          size,
          ...(company ? { company } : {}),
          ...(state ? { state } : {}),
          ...(city ? { city } : {}),
        },
      }),
      transformResponse: normalizeCompanyPage,
      providesTags: [{ type: "Company", id: "LIST" }],
    }),
    getCompany: builder.query({
      query: (id) => `${API_ENDPOINTS.companies}/${id}`,
      transformResponse: unwrapApiEnvelope,
      providesTags: (_result, _error, id) => [{ type: "Company", id }],
    }),
    createCompany: builder.mutation({
      query: (body) => ({ url: API_ENDPOINTS.companies, method: "POST", body }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),
    updateCompany: builder.mutation({
      query: ({ id, ...body }) => ({ url: `${API_ENDPOINTS.companies}/${id}`, method: "PUT", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Company", id }, { type: "Company", id: "LIST" }],
    }),
    deleteCompany: builder.mutation({
      query: (id) => ({ url: `${API_ENDPOINTS.companies}/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [{ type: "Company", id }, { type: "Company", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useGetCompanyQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} = companiesApi;
