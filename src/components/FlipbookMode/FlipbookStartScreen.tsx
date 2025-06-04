import { FlipbookPage } from "@/lib/enums";
import React from "react";

interface FlipbookStartScreenProps {
  setCurrentPage: (page: FlipbookPage) => void;
}

const FlipbookStartScreen: React.FC<FlipbookStartScreenProps> = ({
  setCurrentPage,
}) => {
  return <div>FlipbookStartScreen</div>;
};

export default FlipbookStartScreen;
