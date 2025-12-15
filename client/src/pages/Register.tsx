import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { register as registerRequest } from "../api/client";
import { useAuthStore } from "../store/auth";

const schema = z.object({
  username: z.string().trim().min(3, "Минимум 3 символа").max(32, "Максимум 32 символа"),
  email: z.string().trim().toLowerCase().email({ message: "Введите корректный email" }),
  password: z
    .string()
    .min(8, "Минимум 8 символов")
    .max(64, "Максимум 64 символа")
    .regex(/[A-Za-z]/, "Добавьте буквы")
    .regex(/[0-9]/, "Добавьте цифры")
});

type FormValues = z.infer<typeof schema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", email: "", password: "" }
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { register: payload } = await registerRequest(values);
      setAuth(payload);
      navigate("/");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Не удалось создать аккаунт");
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Регистрация</h1>
        <p className="subtitle">Создай профиль и начинай расстановку кораблей</p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <label htmlFor="username">Никнейм</label>
            <input id="username" autoComplete="username" {...register("username")} />
            {errors.username && <div className="error">{errors.username.message}</div>}
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <div className="error">{errors.email.message}</div>}
          </div>
          <div>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && <div className="error">{errors.password.message}</div>}
          </div>
          {serverError && <div className="error">{serverError}</div>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Создаем..." : "Создать аккаунт"}
          </button>
        </form>
        <div className="footer">
          Уже в игре? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
