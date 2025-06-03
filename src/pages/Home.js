import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QRCodeCanvas } from "qrcode.react";
const Home = () => {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: [_jsx("p", { className: "text-2xl font-bold mb-4", children: "SCAN THISS" }), _jsx(QRCodeCanvas, { value: "yes" })] }));
};
export default Home;
