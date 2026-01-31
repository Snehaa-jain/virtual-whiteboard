import { createContext } from "react";

const boardContext = createContext({
    activeToolItem: "",
    elements: [],
    setElements: () => {},
    changeTool: () => {},
    undo: () => {},
    redo: () => {},
    strokeColor: "#000000",
    setStrokeColor: () => {},
    strokeWidth: 2,
    setStrokeWidth: () => {},
});

export default boardContext;