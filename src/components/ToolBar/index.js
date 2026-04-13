import React, { useContext, useState, useRef, useEffect } from "react";
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
  FaCloudUploadAlt,
  FaSpinner,
  FaCheck,
  FaTimes,
} from "react-icons/fa";

import { LuRectangleHorizontal } from "react-icons/lu";

import boardContext from "../../store/board-context";
import { TOOL_ITEMS } from "../../constants";

const ToolBar = ({ currentWorkId, onUpdateUser, onAfterSave }) => {
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

  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved"

  // ✅ Modal state — replaces window.prompt
  const [modal, setModal] = useState({ visible: false, projectName: "My Awesome Sketch" });
  const modalInputRef = useRef();

  // ✅ Auto focus modal input when it appears
  useEffect(() => {
    if (modal.visible && modalInputRef.current) {
      modalInputRef.current.focus();
      modalInputRef.current.select();
    }
  }, [modal.visible]);

  const handleDownload = () => {
    const canvas = document.querySelector("canvas");
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = dataUrl;
    link.click();
  };

  const handleSave = () => {
    if (saveState === "saving") return;

    const savedData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!savedData || !token) {
      return alert("Please login to save your work!");
    }

    const user = JSON.parse(savedData);
    const userId = user.id || user._id;

    if (!userId) {
      return alert("Session error. Please logout and login again.");
    }

    const isExistingProject = !!currentWorkId;

    if (isExistingProject) {
      // ✅ Existing project — save directly, no modal needed
      performSave(null);
    } else {
      // ✅ New project — show modal to get project name
      setModal({ visible: true, projectName: "My Awesome Sketch" });
    }
  };

  // ✅ Called when user confirms the modal
  const handleModalConfirm = () => {
    const name = modal.projectName.trim();
    if (!name) return;
    setModal({ visible: false, projectName: "" });
    performSave(name);
  };

  // ✅ Called when user cancels the modal
  const handleModalCancel = () => {
    setModal({ visible: false, projectName: "" });
  };

  // ✅ The actual save logic — separated from UI
  const performSave = async (projectName) => {
    const canvas = document.querySelector("canvas");
    const dataUrl = canvas.toDataURL("image/png");

    const savedData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const user = JSON.parse(savedData);
    const userId = user.id || user._id;

    const isExistingProject = !!currentWorkId;
    const endpoint = isExistingProject ? "update-canvas" : "save-canvas";
    const method = isExistingProject ? "PATCH" : "POST";

    setSaveState("saving");

    try {
      const response = await fetch(`http://localhost:5000/api/users/${endpoint}`, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId,
          workId: currentWorkId, 
          canvasData: dataUrl,
          title: projectName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (onUpdateUser) onUpdateUser(data.user);

        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);

        if (!isExistingProject && onAfterSave) {
          const newWork = data.user.savedWork[data.user.savedWork.length - 1];
          onAfterSave(newWork);
        }
      } else {
        alert(data.message || "Save failed.");
        setSaveState("idle");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Network error: Could not reach the server.");
      setSaveState("idle");
    }
  };

  const SaveIcon = () => {
    if (saveState === "saving") return <FaSpinner className={classes.spin} />;
    if (saveState === "saved") return <FaCheck style={{ color: "#40c057" }} />;
    return <FaCloudUploadAlt />;
  };

  return (
    <>
      {/* ✅ Save Name Modal — appears centered over the canvas */}
      {modal.visible && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3 className={classes.modalTitle}>Name your project</h3>
            <input
              ref={modalInputRef}
              type="text"
              value={modal.projectName}
              onChange={(e) => setModal(prev => ({ ...prev, projectName: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleModalConfirm();
                if (e.key === "Escape") handleModalCancel();
              }}
              className={classes.modalInput}
              placeholder="Enter project name..."
            />
            <div className={classes.modalActions}>
              <button 
                onClick={handleModalCancel}
                className={`${classes.modalBtn} ${classes.modalCancel}`}
              >
                <FaTimes /> Cancel
              </button>
              <button 
                onClick={handleModalConfirm}
                className={`${classes.modalBtn} ${classes.modalConfirm}`}
                disabled={!modal.projectName.trim()}
              >
                <FaCheck /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className={classes.container}>
        <div className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.LINE })} onClick={() => changeTool(TOOL_ITEMS.LINE)}>
          <FaSlash />
        </div>

        <div className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.CIRCLE })} onClick={() => changeTool(TOOL_ITEMS.CIRCLE)}>
          <FaRegCircle />
        </div>

        <div className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.RECTANGLE })} onClick={() => changeTool(TOOL_ITEMS.RECTANGLE)}>
          <LuRectangleHorizontal />
        </div>

        <div className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.ARROW })} onClick={() => changeTool(TOOL_ITEMS.ARROW)}>
          <FaArrowRight />
        </div>

        <div className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.BRUSH })} onClick={() => changeTool(TOOL_ITEMS.BRUSH)}>
          <FaPaintBrush />
        </div>

        <div className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.ERASER })} onClick={() => changeTool(TOOL_ITEMS.ERASER)}>
          <FaEraser />
        </div>

        <div className={cx(classes.toolItem, { [classes.active]: activeToolItem === TOOL_ITEMS.TEXT })} onClick={() => changeTool(TOOL_ITEMS.TEXT)}>
          <FaFont />
        </div>

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

        <div className={classes.toolItem} onClick={undo} title="Undo">
          <FaUndoAlt />
        </div>

        <div className={classes.toolItem} onClick={redo} title="Redo">
          <FaRedoAlt />
        </div>

        <div className={classes.toolItem} onClick={handleDownload} title="Download PNG">
          <FaDownload />
        </div>

        <div 
          className={cx(classes.toolItem, { [classes.saving]: saveState === "saving" })} 
          onClick={handleSave} 
          title={currentWorkId ? "Save Changes" : "Save New Project"}
        >
          <SaveIcon />
        </div>
      </div>
    </>
  );
};

export default ToolBar;