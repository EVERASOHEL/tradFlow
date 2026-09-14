export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectSessionExpiredNotice = (state) => state.auth.sessionExpiredNotice;
