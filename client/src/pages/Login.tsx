import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/client";
import { useAuthStore } from "../store/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Введите корректный email" }),
  password: z.string().min(1, "Пароль обязателен")
});

type FormValues = z.infer<typeof schema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" }
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { login: payload } = await login(values);
      setAuth(payload);
      navigate("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Ошибка входа");
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Вход</h1>
        <p className="subtitle">Вернись в бой</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" {...formRegister("email")} />
            {errors.email && <div className="error">{errors.email.message}</div>}
          </div>
          <div>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...formRegister("password")}
            />
            {errors.password && <div className="error">{errors.password.message}</div>}
          </div>
          {serverError && <div className="error">{serverError}</div>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Входим..." : "Войти"}
          </button>
        </form>
        <div className="footer">
          Нет аккаунта? <Link to="/register">Создать</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
