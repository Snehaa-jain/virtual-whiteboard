import React, { useState, useCallback } from "react";
import boardContext from "./board-context";
import { TOOL_ITEMS } from "../constants";

const BoardProvider = ({ children }) => {
  const [activeToolItem, setActiveToolItem] = useState(TOOL_ITEMS.LINE);
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  
  // Styling State
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);

  const changeTool = (tool) => setActiveToolItem(tool);

  const undo = useCallback(() => {
    if (elements.length === 0) return;
    const lastElement = elements[elements.length - 1];
    setHistory((prev) => [...prev, lastElement]);
    setElements((prev) => prev.slice(0, -1));
  }, [elements]);

  const redo = useCallback(() => {
    if (history.length === 0) return;
    const elementToRestore = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setElements((prev) => [...prev, elementToRestore]);
  }, [history]);

  return (
    <boardContext.Provider
      value={{ 
        activeToolItem, changeTool, elements, setElements, undo, redo,
        strokeColor, setStrokeColor, strokeWidth, setStrokeWidth 
      }}
    >
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;