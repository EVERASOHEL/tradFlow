import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import companyReducer from "../features/companies/companySlice";
import { authApi } from "../features/auth/authApi";
import { usersApi } from "../features/users/usersApi";
import { accessApi } from "../features/access/accessApi";
import { companiesApi } from "../features/companies/companiesApi";
import { productsApi } from "../features/products/productsApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    company: companyReducer,
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [accessApi.reducerPath]: accessApi.reducer,
    [companiesApi.reducerPath]: companiesApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      usersApi.middleware,
      accessApi.middleware,
      companiesApi.middleware,
      productsApi.middleware
    ),
});
