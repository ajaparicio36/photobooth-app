import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { PhotoModePage } from "@/lib/enums";
const PhotoPreview = ({ photos, setCurrentPage, paperType, }) => {
    return (_jsxs("div", { children: ["PhotoPreview", photos.length > 0 ? (_jsx("ul", { children: photos.map((photo, index) => (_jsxs("li", { children: [photo.name, " - ", Math.round(photo.size / 1024), " KB"] }, index))) })) : (_jsx("p", { children: "No photos captured yet." })), _jsx("div", { children: "Done?" }), _jsx("button", { onClick: () => setCurrentPage(PhotoModePage.SelectFilterPage), children: "Go to Select Filter Page" })] }));
};
export default PhotoPreview;
