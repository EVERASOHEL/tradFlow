import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "../../../components/common/Input/Input";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { forgotPasswordSchema } from "../auth.schemas";
import "../auth.css";

export default function ForgotPasswordForm({ onSubmit, isSubmitting, submitError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { username: "" },
  });

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <ErrorMessage>{submitError}</ErrorMessage>

      <Input
        id="username"
        label="UserName"
        type="text"
        autoComplete="username"
        placeholder="Enter your username"
        error={errors.username?.message}
        {...register("username")}
      />

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
}
