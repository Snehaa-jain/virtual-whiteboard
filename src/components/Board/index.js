import { useRef, useState, useContext, useLayoutEffect } from "react";
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
    case TOOL_ITEMS.ERASER:
      // Eraser stays white and thick
      return generator.linearPath(points, { stroke: "white", strokeWidth: 60, roughness: 0 });
    default:
      return null;
  }
};

function Board() {
  const canvasRef = useRef();
  const [isDrawing, setIsDrawing] = useState(false);
  const { activeToolItem, elements, setElements, strokeColor, strokeWidth } = useContext(boardContext);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const roughCanvas = rough.canvas(canvas);

    elements.forEach((el) => {
      if (el.type === TOOL_ITEMS.TEXT) {
        context.font = "24px sans-serif";
        context.fillStyle = el.stroke || "#000000";
        context.fillText(el.text, el.x, el.y);
      } else if (Array.isArray(el.roughElement)) {
        el.roughElement.forEach((s) => roughCanvas.draw(s));
      } else if (el.roughElement) {
        roughCanvas.draw(el.roughElement);
      }
    });
  }, [elements]);

  const handleMouseDown = (event) => {
    const { clientX, clientY } = event;
    
    if (activeToolItem === TOOL_ITEMS.TEXT) {
      const text = window.prompt("Enter text:");
      if (text) {
        setElements(prev => [...prev, { 
            type: TOOL_ITEMS.TEXT, x: clientX, y: clientY, text, stroke: strokeColor 
        }]);
      }
      return;
    }

    setIsDrawing(true);
    const options = { stroke: strokeColor, strokeWidth: strokeWidth };
    const roughElement = generateElement(clientX, clientY, clientX, clientY, activeToolItem, [[clientX, clientY]], options);

    const newElement = { 
      x1: clientX, y1: clientY, x2: clientX, y2: clientY, 
      type: activeToolItem, points: [[clientX, clientY]], 
      roughElement, stroke: strokeColor, strokeWidth: strokeWidth 
    };
    setElements((prev) => [...prev, newElement]);
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const { clientX, clientY } = event;
    const index = elements.length - 1;
    const currElement = elements[index];

    // THE FIX: Always use the color saved in the element during MouseDown
    const options = { stroke: currElement.stroke, strokeWidth: currElement.strokeWidth };

    let updatedElement;
    if (currElement.type === TOOL_ITEMS.BRUSH || currElement.type === TOOL_ITEMS.ERASER) {
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

  return <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setIsDrawing(false)} style={{ position: "fixed", top: 0, left: 0, zIndex: 0 }} />;
}

export default Board;