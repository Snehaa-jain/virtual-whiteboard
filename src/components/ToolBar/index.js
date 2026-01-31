import React, { useContext } from "react";
import classes from "./index.module.css";
import cx from "classnames";

import {
  FaSlash,
  FaRegCircle,
  FaEraser,
  FaArrowRight,
  FaDownload,
  FaFont,
  FaPaintBrush,
  FaUndoAlt,
  FaRedoAlt,
} from "react-icons/fa";

import { LuRectangleHorizontal } from "react-icons/lu";

import boardContext from "../../store/board-context";
import { TOOL_ITEMS } from "../../constants";

const ToolBar = () => {
  // Destructure the new styling states from context
  const { 
    activeToolItem, 
    changeTool, 
    undo, 
    redo, 
    strokeColor, 
    setStrokeColor, 
    strokeWidth, 
    setStrokeWidth 
  } = useContext(boardContext);

  const handleDownload = () => {
    const canvas = document.querySelector("canvas");
    // Note: Since we updated Board to draw a white background, 
    // this will now export with a white background instead of black.
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className={classes.container}>
      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.LINE,
        })}
        onClick={() => changeTool(TOOL_ITEMS.LINE)}
      >
        <FaSlash />
      </div>

      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.CIRCLE,
        })}
        onClick={() => changeTool(TOOL_ITEMS.CIRCLE)}
      >
        <FaRegCircle />
      </div>

      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.RECTANGLE,
        })}
        onClick={() => changeTool(TOOL_ITEMS.RECTANGLE)}
      >
        <LuRectangleHorizontal />
      </div>

      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.ARROW,
        })}
        onClick={() => changeTool(TOOL_ITEMS.ARROW)}
      >
        <FaArrowRight />
      </div>

      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.BRUSH,
        })}
        onClick={() => changeTool(TOOL_ITEMS.BRUSH)}
      >
        <FaPaintBrush />
      </div>

      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.ERASER,
        })}
        onClick={() => changeTool(TOOL_ITEMS.ERASER)}
      >
        <FaEraser />
      </div>

      <div
        className={cx(classes.toolItem, {
          [classes.active]: activeToolItem === TOOL_ITEMS.TEXT,
        })}
        onClick={() => changeTool(TOOL_ITEMS.TEXT)}
      >
        <FaFont />
      </div>

      {/* NEW STYLING SECTION */}
      <div className={classes.styleContainer}>
        <input
          type="color"
          value={strokeColor}
          className={classes.colorPicker}
          onChange={(e) => setStrokeColor(e.target.value)}
          title="Stroke Color"
        />
        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          className={classes.slider}
          onChange={(e) => setStrokeWidth(e.target.value)}
          title="Stroke Width"
        />
      </div>

      <div className={classes.toolItem} onClick={undo}>
        <FaUndoAlt />
      </div>

      <div className={classes.toolItem} onClick={redo}>
        <FaRedoAlt />
      </div>

      <div className={classes.toolItem} onClick={handleDownload}>
        <FaDownload />
      </div>
    </div>
  );
};

export default ToolBar;