import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
const Done = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const message = searchParams.get("message") || "Operation completed successfully";
    useEffect(() => {
        // Auto-redirect to home after 5 seconds
        const timer = setTimeout(() => {
            navigate("/");
        }, 5000);
        return () => clearTimeout(timer);
    }, [navigate]);
    return (_jsx("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: _jsxs("div", { className: "bg-white p-8 rounded-lg shadow-lg text-center max-w-md", children: [_jsx("div", { className: "text-6xl mb-4", children: "\u2705" }), _jsx("h1", { className: "text-3xl font-bold mb-4", children: "All Done!" }), _jsx("p", { className: "text-gray-600 mb-6", children: message }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: "Redirecting to home in 5 seconds..." }), _jsx("button", { onClick: () => navigate("/"), className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg", children: "Go Home Now" })] }) }));
};
export default Done;
