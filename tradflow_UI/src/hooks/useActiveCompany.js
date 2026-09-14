import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import {
  selectActiveCompany,
  setActiveCompany,
  clearActiveCompany,
} from "../features/companies/companySlice";

export function useActiveCompany() {
  const dispatch = useDispatch();
  const activeCompany = useSelector(selectActiveCompany);

  const selectCompany = useCallback(
    (company) => {
      dispatch(setActiveCompany(company));
    },
    [dispatch]
  );

  const clearCompany = useCallback(() => {
    dispatch(clearActiveCompany());
  }, [dispatch]);

  return { activeCompany, selectCompany, clearCompany };
}

