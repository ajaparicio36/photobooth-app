import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const Done: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const message =
    searchParams.get("message") || "Operation completed successfully";

  useEffect(() => {
    // Auto-redirect to home after 5 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold mb-4">All Done!</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <p className="text-sm text-gray-500 mb-4">
          Redirecting to home in 5 seconds...
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
        >
          Go Home Now
        </button>
      </div>
    </div>
  );
};

export default Done;
