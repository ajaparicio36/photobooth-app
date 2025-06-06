import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy } from "react";
import { Route, Routes, Navigate, useLocation, } from "react-router-dom";
const PhotoMode = lazy(() => import("./pages/PhotoMode"));
const FlipbookMode = lazy(() => import("./pages/FlipbookMode"));
const Error = lazy(() => import("./pages/Error"));
const Done = lazy(() => import("./pages/Done"));
const Home = lazy(() => import("./pages/Home"));
function App() {
    const location = useLocation();
    // Debug logging for Electron
    if (window.electronAPI) {
        console.log("Current location:", location);
    }
    return (_jsx("div", { className: "min-h-screen bg-background", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/photo", element: _jsx(PhotoMode, {}) }), _jsx(Route, { path: "/flipbook", element: _jsx(FlipbookMode, {}) }), _jsx(Route, { path: "/error", element: _jsx(Error, {}) }), _jsx(Route, { path: "/done", element: _jsx(Done, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
}
export default App;
