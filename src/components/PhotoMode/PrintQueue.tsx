import React from "react";

interface PrintQueueProps {
  printFile: File | null;
}

const PrintQueue: React.FC<PrintQueueProps> = ({ printFile }) => {
  return <div>PrintQueue</div>;
};

export default PrintQueue;
