import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PasswordField from "./PasswordField";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { resetPasswordSchema } from "../auth.schemas";
import "../auth.css";

export default function ResetPasswordForm({ onSubmit, isSubmitting, submitError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <ErrorMessage>{submitError}</ErrorMessage>

      <PasswordField
        id="password"
        label="New password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register("password")}
      />

      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="Re-enter your new password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Reset password
      </Button>
    </form>
  );
}
