import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PaperType, PhotoModePage } from "@/lib/enums";
const ChoosePaperType = ({ setCurrentPage, setPaperType, }) => {
    const handlePaperTypeSelect = (type) => {
        setPaperType(type);
        setCurrentPage(PhotoModePage.CapturePhotoScreen);
    };
    return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen bg-gray-100", children: [_jsx("h1", { className: "text-3xl font-bold mb-8", children: "Choose Paper Type" }), _jsxs("div", { className: "flex gap-8", children: [_jsx("button", { onClick: () => handlePaperTypeSelect(PaperType.TwoBySix), className: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-xl", children: "2x6" }), _jsx("div", { className: "text-sm", children: "2 Photos" })] }) }), _jsx("button", { onClick: () => handlePaperTypeSelect(PaperType.FourBySix), className: "bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-xl", children: "4x6" }), _jsx("div", { className: "text-sm", children: "4 Photos" })] }) })] })] }));
};
export default ChoosePaperType;
