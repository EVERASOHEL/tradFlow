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

export const salesApi = createApi({
  reducerPath: "salesApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Sale", "Customer", "Stock"],
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (companyId) => ({
        url: API_ENDPOINTS.parties,
        params: {
          type: "CUSTOMER",
          ...(companyId ? { companyId } : {}),
        },
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Customer", id: "LIST" }],
    }),

    createCustomer: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINTS.parties,
        method: "POST",
        body: {
          ...body,
          partyType: "CUSTOMER",
          country: body.country || "India",
          currencyCode: body.currencyCode || "INR",
          active: true,
        },
      }),
      invalidatesTags: [{ type: "Customer", id: "LIST" }],
    }),

    getSales: builder.query({
      query: ({ companyId, transactionType, status, search, page = 0, size = 50 } = {}) => ({
        url: API_ENDPOINTS.sales,
        params: {
          ...(companyId ? { companyId } : {}),
          ...(transactionType ? { transactionType } : {}),
          ...(status ? { status } : {}),
          ...(search ? { search } : {}),
          page,
          size,
        },
      }),
      transformResponse: normalizePageData,
      providesTags: (result) =>
        result?.records
          ? [
              ...result.records.map(({ id }) => ({ type: "Sale", id })),
              { type: "Sale", id: "LIST" },
            ]
          : [{ type: "Sale", id: "LIST" }],
    }),

    getSaleById: builder.query({
      query: (id) => `${API_ENDPOINTS.sales}/${id}`,
      transformResponse: unwrapApiEnvelope,
      providesTags: (_result, _err, id) => [{ type: "Sale", id }],
    }),

    createSale: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINTS.sales,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Sale", id: "LIST" },
        { type: "Stock", id: "SUMMARY" },
        { type: "Stock", id: "MOVEMENTS" },
      ],
    }),

    cancelSale: builder.mutation({
      query: ({ id, reason }) => ({
        url: `${API_ENDPOINTS.sales}/${id}/cancel`,
        method: "POST",
        params: { ...(reason ? { reason } : {}) },
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Sale", id },
        { type: "Sale", id: "LIST" },
        { type: "Stock", id: "SUMMARY" },
        { type: "Stock", id: "MOVEMENTS" },
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useGetSalesQuery,
  useGetSaleByIdQuery,
  useCreateSaleMutation,
  useCancelSaleMutation,
} = salesApi;

