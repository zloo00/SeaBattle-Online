import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const RegisterPage = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [serverError, setServerError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { username: "", email: "", password: "" }
    });
    const onSubmit = async (values) => {
        setServerError(null);
        try {
            const { register: payload } = await registerRequest(values);
            setAuth(payload);
            navigate("/");
        }
        catch (err) {
            setServerError(err instanceof Error ? err.message : "Не удалось создать аккаунт");
        }
    };
    return (_jsx("div", { className: "page", children: _jsxs("div", { className: "card", children: [_jsx("h1", { className: "title", children: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F" }), _jsx("p", { className: "subtitle", children: "\u0421\u043E\u0437\u0434\u0430\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u0438 \u043D\u0430\u0447\u0438\u043D\u0430\u0439 \u0440\u0430\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0443 \u043A\u043E\u0440\u0430\u0431\u043B\u0435\u0439" }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), noValidate: true, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "username", children: "\u041D\u0438\u043A\u043D\u0435\u0439\u043C" }), _jsx("input", { id: "username", autoComplete: "username", ...register("username") }), errors.username && _jsx("div", { className: "error", children: errors.username.message })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", children: "Email" }), _jsx("input", { id: "email", type: "email", autoComplete: "email", ...register("email") }), errors.email && _jsx("div", { className: "error", children: errors.email.message })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", children: "\u041F\u0430\u0440\u043E\u043B\u044C" }), _jsx("input", { id: "password", type: "password", autoComplete: "new-password", ...register("password") }), errors.password && _jsx("div", { className: "error", children: errors.password.message })] }), serverError && _jsx("div", { className: "error", children: serverError }), _jsx("button", { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Создаем..." : "Создать аккаунт" })] }), _jsxs("div", { className: "footer", children: ["\u0423\u0436\u0435 \u0432 \u0438\u0433\u0440\u0435? ", _jsx(Link, { to: "/login", children: "\u0412\u043E\u0439\u0442\u0438" })] })] }) }));
};
export default RegisterPage;
