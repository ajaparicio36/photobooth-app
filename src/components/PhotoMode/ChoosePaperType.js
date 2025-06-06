import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PaperType, PhotoModePage } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
const ChoosePaperType = ({ setCurrentPage, setPaperType, }) => {
    const navigate = useNavigate();
    const handlePaperTypeSelect = (type) => {
        setPaperType(type);
        setCurrentPage(PhotoModePage.CapturePhotoScreen);
    };
    const paperTypes = [
        {
            type: PaperType.TwoBySix,
            name: "2×6 Strip",
            photos: 2,
            description: "Classic photo strip format",
            aspect: "2:6",
        },
        {
            type: PaperType.FourBySix,
            name: "4×6 Layout",
            photos: 4,
            description: "Standard photo layout",
            aspect: "4:6",
        },
    ];
    return (_jsxs("div", { className: "h-screen mono-gradient flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-mono-200 bg-white/50 backdrop-blur-sm flex-shrink-0", children: _jsxs("div", { className: "max-w-4xl mx-auto flex items-center justify-between", children: [_jsxs(Button, { variant: "ghost", onClick: () => navigate("/"), className: "text-mono-700 hover:text-mono-900", children: [_jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }), "Back to Home"] }), _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-xl font-bold text-mono-900", children: "Paper Type" }), _jsx("p", { className: "text-xs text-mono-600", children: "Choose your layout format" })] }), _jsx("div", { className: "w-24" })] }) }), _jsx("div", { className: "flex-1 flex items-center justify-center p-4 min-h-0", children: _jsxs("div", { className: "max-w-2xl w-full", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "w-12 h-12 mx-auto mb-4 rounded-full bg-mono-900 flex items-center justify-center", children: _jsx(LayoutGrid, { className: "w-6 h-6 text-white" }) }), _jsx("h2", { className: "text-2xl font-bold text-mono-900 mb-2", children: "Select Paper Type" }), _jsx("p", { className: "text-mono-600 text-sm", children: "Choose the layout that best fits your photo session" })] }), _jsx("div", { className: "grid md:grid-cols-2 gap-4", children: paperTypes.map((paper) => (_jsxs(Card, { className: "glass-card hover:shadow-2xl transition-all duration-300 group cursor-pointer", onClick: () => handlePaperTypeSelect(paper.type), children: [_jsxs(CardHeader, { className: "text-center pb-3", children: [_jsx("div", { className: "w-10 h-10 mx-auto mb-3 rounded-lg bg-mono-100 flex items-center justify-center group-hover:bg-mono-900 transition-colors duration-300", children: _jsx("div", { className: "text-mono-900 group-hover:text-white font-bold text-xs transition-colors duration-300", children: paper.aspect }) }), _jsx(CardTitle, { className: "text-lg text-mono-900", children: paper.name }), _jsxs(Badge, { variant: "secondary", className: "w-fit mx-auto text-xs", children: [paper.photos, " Photos"] })] }), _jsxs(CardContent, { className: "text-center", children: [_jsx("p", { className: "text-mono-600 mb-4 text-sm", children: paper.description }), _jsx(Button, { className: "w-full bg-mono-900 hover:bg-mono-800 text-white", children: "Select Format" })] })] }, paper.type))) })] }) })] }));
};
export default ChoosePaperType;
