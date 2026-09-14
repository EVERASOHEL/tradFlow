import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { createUserSchema, updateUserSchema } from "../user.schemas";
import { useGetRolesQuery } from "../../access/accessApi";

function getRecords(data) {
  return Array.isArray(data) ? data : data?.content ?? data?.data ?? [];
}

function resolveInitialRoleId(user) {
  const assigned = user?.roles ?? user?.role;
  const role = Array.isArray(assigned) ? assigned[0] : assigned;
  if (!role) return "";
  if (typeof role === "object") return String(role.id ?? "");
  return String(role);
}

const CREATE_DEFAULTS = {
  username: "",
  email: "",
  password: "",
  fullName: "",
  phone: "",
  active: true,
  roleId: "",
};

export default function UserForm({ user, onCancel, onSubmit, isLoading, error }) {
  const isEditing = Boolean(user);

  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery();
  const roles = getRecords(rolesData).filter((r) => r.active !== false);

  const editDefaults = {
    email:         user?.email         ?? "",
    fullName:      user?.fullName      ?? "",
    phone:         user?.phone         ?? "",
    active:        user?.active        ?? true,
    accountLocked: user?.accountLocked ?? false,
    roleId:        resolveInitialRoleId(user),
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: isEditing ? editDefaults : CREATE_DEFAULTS,
  });

  useEffect(() => {
    reset(isEditing ? {
      email:         user?.email         ?? "",
      fullName:      user?.fullName      ?? "",
      phone:         user?.phone         ?? "",
      active:        user?.active        ?? true,
      accountLocked: user?.accountLocked ?? false,
      roleId:        resolveInitialRoleId(user),
    } : CREATE_DEFAULTS);
  }, [isEditing, reset, user]);

  const submit = (values) =>
    onSubmit(isEditing ? { id: user.id, ...values } : values);

  return (
    <form className="user-modal-form" onSubmit={handleSubmit(submit)}>
      {/* Head */}
      <div className="user-modal-head">
        <div>
          <p className="access-kicker">
            {isEditing ? "Account maintenance" : "New account"}
          </p>
          <h2>{isEditing ? "Edit user" : "Create user"}</h2>
        </div>
        <button className="access-close" type="button" onClick={onCancel} aria-label="Close dialog">
          ×
        </button>
      </div>

      <ErrorMessage>{error?.data?.message || error?.error || ""}</ErrorMessage>

      {/* Grid */}
      <div className="user-modal-grid">
        {!isEditing && (
          <div className="user-modal-field">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="e.g. john"
              className={`user-modal-input ${errors.username ? "user-modal-input--error" : ""}`}
              {...register("username")}
            />
            {errors.username?.message && (
              <span className="user-modal-field-error">{errors.username.message}</span>
            )}
          </div>
        )}

        <div className="user-modal-field">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            className={`user-modal-input ${errors.email ? "user-modal-input--error" : ""}`}
            {...register("email")}
          />
          {errors.email?.message && (
            <span className="user-modal-field-error">{errors.email.message}</span>
          )}
        </div>

        {!isEditing && (
          <div className="user-modal-field">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className={`user-modal-input ${errors.password ? "user-modal-input--error" : ""}`}
              {...register("password")}
            />
            {errors.password?.message && (
              <span className="user-modal-field-error">{errors.password.message}</span>
            )}
          </div>
        )}

        <div className="user-modal-field">
          <label htmlFor="fullName">Full name *</label>
          <input
            id="fullName"
            type="text"
            placeholder="First and last name"
            className={`user-modal-input ${errors.fullName ? "user-modal-input--error" : ""}`}
            {...register("fullName")}
          />
          {errors.fullName?.message && (
            <span className="user-modal-field-error">{errors.fullName.message}</span>
          )}
        </div>

        <div className="user-modal-field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            placeholder="+91-..."
            className={`user-modal-input ${errors.phone ? "user-modal-input--error" : ""}`}
            {...register("phone")}
          />
          {errors.phone?.message && (
            <span className="user-modal-field-error">{errors.phone.message}</span>
          )}
        </div>

        <div className="user-modal-field">
          <label htmlFor="roleId">Role *</label>
          <select
            id="roleId"
            className={`user-modal-input user-modal-select ${errors.roleId ? "user-modal-input--error" : ""}`}
            disabled={rolesLoading}
            {...register("roleId")}
          >
            <option value="">
              {rolesLoading ? "Loading roles..." : "Select a role"}
            </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>
          {errors.roleId?.message && (
            <span className="user-modal-field-error">{errors.roleId.message}</span>
          )}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="user-modal-toggles">
        <label className="user-modal-checkbox">
          <input type="checkbox" {...register("active")} />
          <span>Active</span>
        </label>
        {isEditing && (
          <label className="user-modal-checkbox">
            <input type="checkbox" {...register("accountLocked")} />
            <span>Account locked</span>
          </label>
        )}
      </div>

      {/* Actions */}
      <div className="user-modal-actions">
        <Button size="sm" variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" type="submit" isLoading={isLoading}>
          {isEditing ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  );
}