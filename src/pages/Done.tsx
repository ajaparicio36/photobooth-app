import React from "react";
import { useSearchParams } from "react-router-dom";

const Done: React.FC = () => {
  const [searchParams] = useSearchParams();
  const message =
    searchParams.get("message") || "Operation completed successfully";

  return <div>Done: {message}</div>;
};

export default Done;
