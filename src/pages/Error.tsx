import React from "react";
import { useSearchParams } from "react-router-dom";

const Error: React.FC = () => {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get("message") || "Unknown error";

  return <div>Error: {errorMessage}</div>;
};

export default Error;
