import { jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from "react-router-dom";
const Error = () => {
    const [searchParams] = useSearchParams();
    const errorMessage = searchParams.get("message") || "Unknown error";
    return _jsxs("div", { children: ["Error: ", errorMessage] });
};
export default Error;
