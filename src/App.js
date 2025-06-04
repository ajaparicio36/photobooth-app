import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
const PhotoMode = lazy(() => import("./pages/PhotoMode"));
const FlipbookMode = lazy(() => import("./pages/FlipbookMode"));
const Error = lazy(() => import("./pages/Error"));
const Done = lazy(() => import("./pages/Done"));
const Home = lazy(() => import("./pages/Home"));
const App = () => {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/photo", element: _jsx(PhotoMode, {}) }), _jsx(Route, { path: "/flipbook", element: _jsx(FlipbookMode, {}) }), _jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/error", element: _jsx(Error, {}) }), _jsx(Route, { path: "/done", element: _jsx(Done, {}) })] }) }));
};
export default App;
