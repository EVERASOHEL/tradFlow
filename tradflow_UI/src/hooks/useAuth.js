import { useSelector } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated } from "../features/auth/authSelectors";

export function useAuth() {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return { user, isAuthenticated };
}
