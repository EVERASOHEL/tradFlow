import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../services/api/apiClient";
import { API_ENDPOINTS } from "../../config/api.config";

const unwrapApiEnvelope = (payload) => payload?.responseObj ?? payload?.data ?? payload?.content ?? payload;

const normalizeProductPage = (payload) => {
  const records = unwrapApiEnvelope(payload);
  const count = Number(payload?.count ?? payload?.total ?? payload?.totalElements ?? (Array.isArray(records) ? records.length : 0));
  return {
    records: Array.isArray(records) ? records : [],
    totalCount: Number.isFinite(count) ? count : 0,
  };
};

export const productsApi = createApi({
  reducerPath: "productsApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Product", "Category", "Subcategory", "Unit", "TaxRate"],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({ page = 0, size = 50, search = "", categoryId = "", companyId = "", isGlobalOnly = false, sortBy = "productName", sortDir = "ASC" } = {}) => ({
        url: API_ENDPOINTS.products,
        params: {
          page,
          size,
          ...(search ? { search } : {}),
          ...(categoryId ? { categoryId } : {}),
          ...(companyId ? { companyId } : {}),
          ...(isGlobalOnly ? { isGlobalOnly } : {}),
          sortBy,
          sortDir,
        },
      }),
      transformResponse: normalizeProductPage,
      providesTags: (result) =>
        result
          ? [
              ...result.records.map(({ id }) => ({ type: "Product", id })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),

    getProduct: builder.query({
      query: (id) => `${API_ENDPOINTS.products}/${id}`,
      transformResponse: unwrapApiEnvelope,
      providesTags: (_result, _error, id) => [{ type: "Product", id }],
    }),

    createProduct: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINTS.products,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ENDPOINTS.products}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.products}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),

    // --- Masters ---
    getCategories: builder.query({
      query: (companyId) => ({
        url: `${API_ENDPOINTS.productMasters}/categories`,
        params: companyId ? { companyId } : {},
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Category", id: "LIST" }],
    }),

    createCategory: builder.mutation({
      query: (body) => ({
        url: `${API_ENDPOINTS.productMasters}/categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    getSubcategories: builder.query({
      query: ({ categoryId, companyId } = {}) => ({
        url: `${API_ENDPOINTS.productMasters}/subcategories`,
        params: {
          categoryId,
          ...(companyId ? { companyId } : {}),
        },
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Subcategory", id: "LIST" }],
    }),

    createSubcategory: builder.mutation({
      query: (body) => ({
        url: `${API_ENDPOINTS.productMasters}/subcategories`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Subcategory", id: "LIST" }],
    }),

    getUnits: builder.query({
      query: (companyId) => ({
        url: `${API_ENDPOINTS.productMasters}/units`,
        params: companyId ? { companyId } : {},
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "Unit", id: "LIST" }],
    }),

    createUnit: builder.mutation({
      query: (body) => ({
        url: `${API_ENDPOINTS.productMasters}/units`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Unit", id: "LIST" }],
    }),

    getTaxRates: builder.query({
      query: (companyId) => ({
        url: `${API_ENDPOINTS.productMasters}/tax-rates`,
        params: companyId ? { companyId } : {},
      }),
      transformResponse: unwrapApiEnvelope,
      providesTags: [{ type: "TaxRate", id: "LIST" }],
    }),

    createTaxRate: builder.mutation({
      query: (body) => ({
        url: `${API_ENDPOINTS.productMasters}/tax-rates`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "TaxRate", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetSubcategoriesQuery,
  useCreateSubcategoryMutation,
  useGetUnitsQuery,
  useCreateUnitMutation,
  useGetTaxRatesQuery,
  useCreateTaxRateMutation,
} = productsApi;

