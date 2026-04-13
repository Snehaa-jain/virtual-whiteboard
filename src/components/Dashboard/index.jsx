import React, { useState, useEffect, useRef } from "react";
import classes from "./index.module.css";
import { FaTrash, FaPen, FaSearch, FaSignOutAlt, FaPlus, FaSpinner, FaCheck, FaTimes } from "react-icons/fa";

const Dashboard = ({ user, onSelectWork, onStartNew, handleLogout, onUpdateUser }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [projects, setProjects] = useState(user.savedWork || []);
  const [deletingId, setDeletingId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);

  // ✅ Delete confirm modal state
  const [deleteModal, setDeleteModal] = useState({ visible: false, workId: null });

  // ✅ Inline rename state
  const [inlineRename, setInlineRename] = useState({ visible: false, workId: null, value: "" });
  const renameInputRef = useRef();

  useEffect(() => {
    setProjects(user.savedWork || []);
  }, [user.savedWork]);

  useEffect(() => {
    if (inlineRename.visible && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [inlineRename.visible]);

  // ✅ Step 1: Show delete modal instead of window.confirm
  const handleDeleteClick = (e, workId) => {
    e.stopPropagation();
    setDeleteModal({ visible: true, workId });
  };

  // ✅ Step 2: User confirmed delete
  const confirmDelete = async () => {
    const { workId } = deleteModal;
    setDeleteModal({ visible: false, workId: null }); // hide modal immediately
    setDeletingId(workId);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:5000/api/users/delete-canvas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, workId }),
      });

      const data = await response.json();

      if (response.ok) {
        onUpdateUser(data.user);
      } else {
        alert(data.message || "Failed to delete. Please try again.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Step 3: User cancelled delete
  const cancelDelete = () => {
    setDeleteModal({ visible: false, workId: null });
  };

  // Rename logic
  const handleRenameClick = (e, workId, currentTitle) => {
    e.stopPropagation();
    setInlineRename({ visible: true, workId, value: currentTitle || "" });
  };

  const commitRename = async () => {
    const { workId, value } = inlineRename;
    if (!value.trim()) { cancelRename(); return; }

    const token = localStorage.getItem("token");
    setRenamingId(workId);
    setInlineRename({ visible: false, workId: null, value: "" });

    try {
      const response = await fetch("http://localhost:5000/api/users/rename-canvas", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id, workId, newTitle: value.trim() }),
      });

      if (response.ok) {
        const updatedList = projects.map((p) =>
          p._id === workId ? { ...p, title: value.trim() } : p
        );
        setProjects(updatedList);
        const updatedUser = { ...user, savedWork: updatedList };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        const data = await response.json();
        alert(data.message || "Failed to rename. Please try again.");
      }
    } catch (err) {
      console.error("Rename error:", err);
      alert("Network error. Please try again.");
    } finally {
      setRenamingId(null);
    }
  };

  const cancelRename = () => {
    setInlineRename({ visible: false, workId: null, value: "" });
  };

  const filteredProjects = projects.filter((p) =>
    (p.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={classes.container}>

      {/* ✅ Delete Confirmation Modal */}
      {deleteModal.visible && (
        <div className={classes.modalOverlay}>
          <div className={classes.modal}>
            <h3 className={classes.modalTitle}>Delete this sketch?</h3>
            <p className={classes.modalSubtitle}>This action cannot be undone.</p>
            <div className={classes.modalActions}>
              <button
                onClick={cancelDelete}
                className={`${classes.modalBtn} ${classes.modalCancel}`}
              >
                <FaTimes /> Cancel
              </button>
              <button
                onClick={confirmDelete}
                className={`${classes.modalBtn} ${classes.modalDelete}`}
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className={classes.navbar}>
        <h1 className={classes.logo}>Cloud<span>Board</span></h1>
        <div className={classes.userSection}>
          <span className={classes.username}>Hello, <strong>{user.name}</strong></span>
          <button onClick={handleLogout} className={classes.logoutBtn}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>

      <div className={classes.hero}>
        <button className={classes.newProjectCard} onClick={onStartNew}>
          <div className={classes.plusIcon}><FaPlus /></div>
          <span>Create New Project</span>
        </button>
      </div>

      <div className={classes.sectionTitleBar}>
        <h2>Your Gallery</h2>
        <div className={classes.searchBox}>
          <FaSearch />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={classes.grid}>
        {filteredProjects.length === 0 ? (
          <p className={classes.emptyMsg}>
            {searchTerm
              ? `No projects found matching "${searchTerm}"`
              : "No projects yet. Create your first one!"}
          </p>
        ) : (
          filteredProjects.map((work, index) => {
            const isDeleting = deletingId === work._id;
            const isRenaming = renamingId === work._id;
            const isInlineRenaming = inlineRename.visible && inlineRename.workId === work._id;
            const isBusy = isDeleting || isRenaming;

            return (
              <div
                key={work._id || index}
                className={`${classes.card} ${isBusy ? classes.cardBusy : ""}`}
                onClick={() => !isBusy && !isInlineRenaming && onSelectWork(work)}
              >
                <div className={classes.previewWrapper}>
                  <img src={work.dataUrl} alt={work.title} />

                  {isBusy ? (
                    <div className={classes.loadingOverlay}>
                      <FaSpinner className={classes.spinner} />
                      <span>{isDeleting ? "Deleting..." : "Renaming..."}</span>
                    </div>
                  ) : (
                    <div className={classes.overlay}>
                      <button
                        onClick={(e) => handleRenameClick(e, work._id, work.title)}
                        className={classes.iconBtn}
                        title="Rename"
                      >
                        <FaPen />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, work._id)}
                        className={`${classes.iconBtn} ${classes.delete}`}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                <div className={classes.cardFooter}>
                  {isInlineRenaming ? (
                    <div
                      className={classes.renameInputWrapper}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={inlineRename.value}
                        onChange={(e) => setInlineRename(prev => ({ ...prev, value: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") cancelRename();
                        }}
                        className={classes.renameInput}
                        placeholder="Enter new title..."
                      />
                      <div className={classes.renameActions}>
                        <button
                          onClick={(e) => { e.stopPropagation(); commitRename(); }}
                          className={`${classes.renameBtn} ${classes.confirmBtn}`}
                          title="Confirm"
                        >
                          <FaCheck />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); cancelRename(); }}
                          className={`${classes.renameBtn} ${classes.cancelBtn}`}
                          title="Cancel"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={classes.projectTitle}>
                        {work.title || `Untitled Sketch ${index + 1}`}
                      </p>
                      <span className={classes.projectDate}>
                        {new Date(work.createdAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dashboard;