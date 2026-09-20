import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../services/api/apiClient";
import { API_ENDPOINTS } from "../../config/api.config";

const unwrapApiEnvelope = (payload) => payload?.responseObj ?? payload?.data ?? payload?.content ?? payload;

export const stockApi = createApi({
  reducerPath: "stockApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Stock"],
  endpoints: (builder) => ({
    getStockSummary: builder.query({
      query: ({ companyId, search = "", lowStockOnly = false } = {}) => ({
        url: API_ENDPOINTS.stock,
        params: {
          ...(companyId ? { companyId } : {}),
          ...(search ? { search } : {}),
          lowStockOnly,
        },
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Stock", id: "SUMMARY" }],
    }),

    getStockMovements: builder.query({
      query: ({ companyId, productId, movementType, page = 0, size = 50 } = {}) => ({
        url: `${API_ENDPOINTS.stock}/movements`,
        params: {
          ...(companyId ? { companyId } : {}),
          ...(productId ? { productId } : {}),
          ...(movementType ? { movementType } : {}),
          page,
          size,
        },
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Stock", id: "MOVEMENTS" }],
    }),

    adjustStock: builder.mutation({
      query: (body) => ({
        url: `${API_ENDPOINTS.stock}/adjust`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Stock", id: "SUMMARY" },
        { type: "Stock", id: "MOVEMENTS" },
      ],
    }),
  }),
});

export const {
  useGetStockSummaryQuery,
  useGetStockMovementsQuery,
  useAdjustStockMutation,
} = stockApi;

