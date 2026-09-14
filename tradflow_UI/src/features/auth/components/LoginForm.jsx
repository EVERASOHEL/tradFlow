import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import Input from "../../../components/common/Input/Input";
import PasswordField from "./PasswordField";
import Button from "../../../components/common/Button/Button";
import ErrorMessage from "../../../components/common/ErrorMessage/ErrorMessage";
import { loginSchema } from "../auth.schemas";
import { ROUTES } from "../../../constants/route.constants";
import "../auth.css";

export default function LoginForm({ onSubmit, isSubmitting, submitError }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <ErrorMessage>{submitError}</ErrorMessage>

      <Input
        id="username"
        label="Username"
        type="text"
        autoComplete="username"
        placeholder="Enter your username"
        error={errors.username?.message}
        {...register("username")}
      />

      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register("password")}
      />

      <div className="auth-form__row-between">
        <label className="auth-form__remember">
          <input type="checkbox" {...register("rememberMe")} />
          Keep me signed in
        </label>
        <Link to={ROUTES.FORGOT_PASSWORD} className="btn btn--ghost">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
