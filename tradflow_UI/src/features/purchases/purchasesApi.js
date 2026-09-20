import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../services/api/apiClient";
import { API_ENDPOINTS } from "../../config/api.config";

const unwrapApiEnvelope = (payload) => payload?.responseObj ?? payload?.data ?? payload?.content ?? payload;

const normalizePageData = (payload) => {
  const records = unwrapApiEnvelope(payload);
  const count = Number(payload?.count ?? payload?.total ?? payload?.totalElements ?? (Array.isArray(records) ? records.length : 0));
  return {
    records: Array.isArray(records) ? records : [],
    totalCount: Number.isFinite(count) ? count : 0,
  };
};

export const purchasesApi = createApi({
  reducerPath: "purchasesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Import", "Purchase", "Supplier", "MarketRates", "Stock"],
  endpoints: (builder) => ({
    // ==========================================
    // SUPPLIERS / PARTIES
    // ==========================================
    getSuppliers: builder.query({
      query: (companyId) => ({
        url: API_ENDPOINTS.parties,
        params: {
          type: "SUPPLIER",
          ...(companyId ? { companyId } : {}),
        },
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Supplier", id: "LIST" }],
    }),

    createSupplier: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINTS.parties,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Supplier", id: "LIST" }],
    }),

    // ==========================================
    // CHINA IMPORTS (LCL TRACKING)
    // ==========================================
    getImports: builder.query({
      query: ({ companyId, page = 0, size = 50, search = "", status = "" } = {}) => ({
        url: API_ENDPOINTS.imports,
        params: {
          companyId,
          page,
          size,
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
        },
      }),
      transformResponse: normalizePageData,
      providesTags: (result) =>
        result
          ? [
              ...result.records.map(({ id }) => ({ type: "Import", id })),
              { type: "Import", id: "LIST" },
            ]
          : [{ type: "Import", id: "LIST" }],
    }),

    getImport: builder.query({
      query: (id) => `${API_ENDPOINTS.imports}/${id}`,
      transformResponse: unwrapApiEnvelope,
      providesTags: (_result, _error, id) => [{ type: "Import", id }],
    }),

    createImport: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINTS.imports,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Import", id: "LIST" }],
    }),

    updateImportStage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ENDPOINTS.imports}/${id}/stage`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Import", id },
        { type: "Import", id: "LIST" },
      ],
    }),

    deleteImport: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.imports}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Import", id },
        { type: "Import", id: "LIST" },
      ],
    }),

    // ==========================================
    // LIVE MARKET & BENCHMARK RATES
    // ==========================================
    getMarketRates: builder.query({
      query: (refresh = false) => ({
        url: `${API_ENDPOINTS.imports}/market-rates`,
        params: refresh ? { refresh: true } : {},
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "MarketRates", id: "LATEST" }],
    }),

    // ==========================================
    // PURCHASES (INVOICES)
    // ==========================================
    getPurchases: builder.query({
      query: ({ companyId, page = 0, size = 50, supplierId = "", transactionType = "", status = "", search = "" } = {}) => ({
        url: API_ENDPOINTS.purchases,
        params: {
          companyId,
          page,
          size,
          ...(supplierId ? { supplierId } : {}),
          ...(transactionType ? { transactionType } : {}),
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
        },
      }),
      transformResponse: normalizePageData,
      providesTags: (result) =>
        result
          ? [
              ...result.records.map(({ id }) => ({ type: "Purchase", id })),
              { type: "Purchase", id: "LIST" },
            ]
          : [{ type: "Purchase", id: "LIST" }],
    }),

    getPurchase: builder.query({
      query: (id) => `${API_ENDPOINTS.purchases}/${id}`,
      transformResponse: unwrapApiEnvelope,
      providesTags: (_result, _error, id) => [{ type: "Purchase", id }],
    }),

    createPurchase: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINTS.purchases,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Purchase", id: "LIST" },
        { type: "Import", id: "LIST" },
        { type: "Stock", id: "SUMMARY" },
        { type: "Stock", id: "MOVEMENTS" },
      ],
    }),

    getSupplierSummaries: builder.query({
      query: (companyId) => ({
        url: `${API_ENDPOINTS.purchases}/supplier-summary`,
        params: { companyId },
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Purchase", id: "LIST" }, { type: "Supplier", id: "LIST" }],
    }),

    deletePurchase: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.purchases}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Purchase", id },
        { type: "Purchase", id: "LIST" },
        { type: "Stock", id: "SUMMARY" },
        { type: "Stock", id: "MOVEMENTS" },
      ],
    }),
  }),
});

export const {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useGetImportsQuery,
  useGetImportQuery,
  useCreateImportMutation,
  useUpdateImportStageMutation,
  useDeleteImportMutation,
  useGetMarketRatesQuery,
  useLazyGetMarketRatesQuery,
  useGetPurchasesQuery,
  useGetPurchaseQuery,
  useGetSupplierSummariesQuery,
  useCreatePurchaseMutation,
  useDeletePurchaseMutation,
} = purchasesApi;

