import React from "react";
import { QRCodeCanvas } from "qrcode.react";

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <p className="text-2xl font-bold mb-4">SCAN THISS</p>
      <QRCodeCanvas value="yes" />
    </div>
  );
};

export default Home;
