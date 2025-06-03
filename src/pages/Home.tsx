import React from "react";
import { QRCodeCanvas } from "qrcode.react";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <p className="text-2xl font-bold mb-4">SCAN THIS</p>
      <QRCodeCanvas value="NIGGER" />
    </div>
  );
};

export default Home;
