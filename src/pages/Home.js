import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
const Home = () => {
    const navigate = useNavigate();
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-purple-600 text-white", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-6xl font-bold mb-4", children: "Photobooth App" }), _jsx("p", { className: "text-xl opacity-90", children: "Choose your experience" })] }), _jsxs("div", { className: "flex gap-6", children: [_jsx("button", { onClick: () => navigate("/photo"), className: "bg-white text-blue-600 px-8 py-4 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg", children: "\uD83D\uDCF8 Photo Mode" }), _jsx("button", { onClick: () => navigate("/flipbook"), className: "bg-white text-purple-600 px-8 py-4 rounded-lg text-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg", children: "\uD83C\uDFAC Flipbook Mode" })] }), _jsx("div", { className: "mt-8 text-center opacity-75", children: _jsx("p", { className: "text-sm", children: "Select a mode to get started" }) })] }));
};
export default Home;
