import { createSlice } from "@reduxjs/toolkit";
import { APP_CONFIG } from "../../config/app.config";
import storageService from "../../services/storage/storageService";

const initialState = {
  user: null,
  isAuthenticated: Boolean(storageService.get(APP_CONFIG.tokenStorageKey)),
  // Set only when a session was cleared *because it expired mid-app-use*,
  // so the login page can show a specific message instead of a blank form.
  sessionExpiredNotice: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.isAuthenticated = true;
      state.sessionExpiredNotice = false;
      storageService.set(APP_CONFIG.tokenStorageKey, token);
      if (refreshToken) {
        storageService.set(APP_CONFIG.refreshTokenStorageKey, refreshToken);
      }
    },
    setCurrentUser(state, action) {
      state.user = action.payload;
    },
    loggedOut(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.sessionExpiredNotice = false;
      storageService.remove(APP_CONFIG.tokenStorageKey);
      storageService.remove(APP_CONFIG.refreshTokenStorageKey);
    },
    sessionExpired(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.sessionExpiredNotice = true;
      storageService.remove(APP_CONFIG.tokenStorageKey);
      storageService.remove(APP_CONFIG.refreshTokenStorageKey);
    },
  },
});

export const { setCredentials, setCurrentUser, loggedOut, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
