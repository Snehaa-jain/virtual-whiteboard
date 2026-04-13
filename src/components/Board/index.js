import { useRef, useState, useContext, useLayoutEffect, useEffect } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ITEMS } from "../../constants";

const generator = rough.generator();

const generateElement = (x1, y1, x2, y2, type, points, options) => {
  const style = { 
    stroke: options?.stroke || "#000000", 
    strokeWidth: options?.strokeWidth || 2 
  };
  
  switch (type) {
    case TOOL_ITEMS.LINE:
      return generator.line(x1, y1, x2, y2, style);
    case TOOL_ITEMS.RECTANGLE:
      return generator.rectangle(x1, y1, x2 - x1, y2 - y1, style);
    case TOOL_ITEMS.CIRCLE:
      return generator.ellipse(x1 + (x2 - x1) / 2, y1 + (y2 - y1) / 2, x2 - x1, y2 - y1, style);
    case TOOL_ITEMS.ARROW:
      const headlen = 15;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      return [
        generator.line(x1, y1, x2, y2, style),
        generator.line(x2, y2, x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6), style),
        generator.line(x2, y2, x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6), style)
      ];
    case TOOL_ITEMS.BRUSH:
      return generator.linearPath(points, style);
    default:
      return null;
  }
};

const drawEraserPath = (ctx, points, strokeWidth) => {
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "rgba(0,0,0,1)";
  ctx.lineWidth = strokeWidth * 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.stroke();
  ctx.restore();
};

function Board({ initialImage }) {
  const canvasRef = useRef();
  const textInputRef = useRef();
  const [isDrawing, setIsDrawing] = useState(false);

  // ✅ Track canvas dimensions in state so resize triggers a redraw
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const { activeToolItem, elements, setElements, strokeColor, strokeWidth } = useContext(boardContext);

  const [textInput, setTextInput] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: "",
  });

  // ✅ Setup Canvas Size on mount
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  // ✅ NEW: Listen for window resize and update canvas dimensions
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Save current drawing as image before resize wipes it
      const dataUrl = canvas.toDataURL();

      // Resize the canvas to new window dimensions
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Update state to trigger redraw
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      // Restore the saved drawing after resize
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    };

    window.addEventListener("resize", handleResize);

    // ✅ Always clean up event listeners to prevent memory leaks
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Clear elements when initialImage changes
  useEffect(() => {
    setElements([]);
  }, [initialImage, setElements]);

  // Auto-focus text input when visible
  useEffect(() => {
    if (textInput.visible && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput.visible]);

  // Main Drawing Loop — now also depends on canvasSize so it redraws on resize
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (initialImage) {
      const img = new Image();
      img.src = initialImage;
      img.onload = () => {
        context.drawImage(img, 0, 0);
        drawAllElements(context);
      };
    } else {
      drawAllElements(context);
    }

    function drawAllElements(ctx) {
      const roughCanvas = rough.canvas(canvas);
      elements.forEach((el) => {
        if (el.type === TOOL_ITEMS.TEXT) {
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.font = "24px sans-serif";
          ctx.fillStyle = el.stroke || "#000000";
          ctx.fillText(el.text, el.x, el.y);
          ctx.restore();
        } else if (el.type === TOOL_ITEMS.ERASER) {
          drawEraserPath(ctx, el.points, el.strokeWidth || strokeWidth);
        } else if (Array.isArray(el.roughElement)) {
          el.roughElement.forEach((s) => roughCanvas.draw(s));
        } else if (el.roughElement) {
          roughCanvas.draw(el.roughElement);
        }
      });
    }
  }, [elements, initialImage, strokeWidth, canvasSize]); // ✅ canvasSize added as dependency

  const commitText = () => {
    if (textInput.value.trim()) {
      setElements(prev => [...prev, {
        type: TOOL_ITEMS.TEXT,
        x: textInput.x,
        y: textInput.y,
        text: textInput.value.trim(),
        stroke: strokeColor,
      }]);
    }
    setTextInput({ visible: false, x: 0, y: 0, value: "" });
  };

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;

    if (textInput.visible) {
      commitText();
      return;
    }

    if (activeToolItem === TOOL_ITEMS.TEXT) {
      setTextInput({ visible: true, x: clientX, y: clientY, value: "" });
      return;
    }

    setIsDrawing(true);
    const options = { stroke: strokeColor, strokeWidth: strokeWidth };

    if (activeToolItem === TOOL_ITEMS.ERASER) {
      const newElement = {
        type: TOOL_ITEMS.ERASER,
        points: [[clientX, clientY]],
        strokeWidth: strokeWidth,
      };
      setElements(prev => [...prev, newElement]);
      return;
    }

    const roughElement = generateElement(clientX, clientY, clientX, clientY, activeToolItem, [[clientX, clientY]], options);
    const newElement = { 
      x1: clientX, y1: clientY, x2: clientX, y2: clientY, 
      type: activeToolItem, points: [[clientX, clientY]], 
      roughElement, stroke: strokeColor, strokeWidth: strokeWidth 
    };
    setElements(prev => [...prev, newElement]);
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const { clientX, clientY } = event;
    const index = elements.length - 1;
    const currElement = elements[index];
    if (!currElement) return;

    const options = { stroke: currElement.stroke, strokeWidth: currElement.strokeWidth };

    let updatedElement;

    if (currElement.type === TOOL_ITEMS.ERASER) {
      updatedElement = {
        ...currElement,
        points: [...currElement.points, [clientX, clientY]],
      };
    } else if (currElement.type === TOOL_ITEMS.BRUSH) {
      const newPoints = [...currElement.points, [clientX, clientY]];
      updatedElement = { 
        ...currElement, 
        points: newPoints, 
        roughElement: generateElement(null, null, null, null, currElement.type, newPoints, options) 
      };
    } else {
      updatedElement = { 
        ...currElement, 
        x2: clientX, y2: clientY, 
        roughElement: generateElement(currElement.x1, currElement.y1, clientX, clientY, currElement.type, null, options) 
      };
    }

    const elementsCopy = [...elements];
    elementsCopy[index] = updatedElement;
    setElements(elementsCopy);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}>
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={() => setIsDrawing(false)} 
        style={{ position: "absolute", top: 0, left: 0 }} 
      />

      {textInput.visible && (
        <input
          ref={textInputRef}
          type="text"
          value={textInput.value}
          onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitText();
            if (e.key === "Escape") setTextInput({ visible: false, x: 0, y: 0, value: "" });
          }}
          style={{
            position: "absolute",
            left: textInput.x,
            top: textInput.y - 24,
            font: "24px sans-serif",
            color: strokeColor,
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${strokeColor}`,
            outline: "none",
            minWidth: "120px",
            zIndex: 10,
            caretColor: strokeColor,
          }}
          placeholder="Type here..."
        />
      )}
    </div>
  );
}

export default Board;