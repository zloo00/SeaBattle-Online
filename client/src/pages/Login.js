import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const LoginPage = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [serverError, setServerError] = useState(null);
    const { register: formRegister, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { email: "", password: "" }
    });
    const onSubmit = async (values) => {
        setServerError(null);
        try {
            const { login: payload } = await login(values);
            setAuth(payload);
            navigate("/");
        }
        catch (err) {
            setServerError(err instanceof Error ? err.message : "Ошибка входа");
        }
    };
    return (_jsx("div", { className: "page", children: _jsxs("div", { className: "card", children: [_jsx("h1", { className: "title", children: "\u0412\u0445\u043E\u0434" }), _jsx("p", { className: "subtitle", children: "\u0412\u0435\u0440\u043D\u0438\u0441\u044C \u0432 \u0431\u043E\u0439" }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), noValidate: true, children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "email", children: "Email" }), _jsx("input", { id: "email", type: "email", autoComplete: "email", ...formRegister("email") }), errors.email && _jsx("div", { className: "error", children: errors.email.message })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", children: "\u041F\u0430\u0440\u043E\u043B\u044C" }), _jsx("input", { id: "password", type: "password", autoComplete: "current-password", ...formRegister("password") }), errors.password && _jsx("div", { className: "error", children: errors.password.message })] }), serverError && _jsx("div", { className: "error", children: serverError }), _jsx("button", { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Входим..." : "Войти" })] }), _jsxs("div", { className: "footer", children: ["\u041D\u0435\u0442 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430? ", _jsx(Link, { to: "/register", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C" })] })] }) }));
};
export default LoginPage;
