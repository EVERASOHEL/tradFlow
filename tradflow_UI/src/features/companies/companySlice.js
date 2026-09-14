import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "tradflow_active_company";

function getInitialActiveCompany() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const initialState = {
  activeCompany: getInitialActiveCompany(),
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setActiveCompany(state, action) {
      state.activeCompany = action.payload;
      try {
        if (action.payload) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(action.payload));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // storage quota exceeded or unavailable
      }
    },
    clearActiveCompany(state) {
      state.activeCompany = null;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  },
});

export const { setActiveCompany, clearActiveCompany } = companySlice.actions;
export const selectActiveCompany = (state) => state.company.activeCompany;
export default companySlice.reducer;

