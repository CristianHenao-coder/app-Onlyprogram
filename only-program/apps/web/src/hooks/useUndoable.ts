import { useState, useCallback } from "react";

export interface UndoableAction<T = any> {
  type: string;
  data: T;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
  description: string;
}

export interface UseUndoableOptions {
  maxHistorySize?: number;
  onUndo?: (action: UndoableAction) => void;
  onRedo?: (action: UndoableAction) => void;
}

export function useUndoable(options: UseUndoableOptions = {}) {
  const { maxHistorySize = 20, onUndo, onRedo } = options;

  const [history, setHistory] = useState<UndoableAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  /**
   * Add an action to history
   */
  const addAction = useCallback(
    (action: UndoableAction) => {
      setHistory((prev) => {
        // Remove any actions after current index (when adding new action after undo)
        const newHistory = prev.slice(0, currentIndex + 1);

        // Add new action
        newHistory.push(action);

        // Limit history size
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
          setCurrentIndex((prev) => prev - 1);
        }

        return newHistory;
      });

      setCurrentIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
    },
    [currentIndex, maxHistorySize],
  );

  /**
   * Undo last action
   */
  const undo = useCallback(async () => {
    if (!canUndo || isUndoing) return;

    const action = history[currentIndex];
    if (!action) return;

    setIsUndoing(true);
    try {
      await action.undo();
      setCurrentIndex((prev) => prev - 1);
      onUndo?.(action);
    } catch (error) {
      console.error("Undo failed:", error);
      throw error;
    } finally {
      setIsUndoing(false);
    }
  }, [canUndo, currentIndex, history, isUndoing, onUndo]);

  /**
   * Redo last undone action
   */
  const redo = useCallback(async () => {
    if (!canRedo || isRedoing) return;

    const action = history[currentIndex + 1];
    if (!action) return;

    setIsRedoing(true);
    try {
      await action.redo();
      setCurrentIndex((prev) => prev + 1);
      onRedo?.(action);
    } catch (error) {
      console.error("Redo failed:", error);
      throw error;
    } finally {
      setIsRedoing(false);
    }
  }, [canRedo, currentIndex, history, isRedoing, onRedo]);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  /**
   * Get current action description
   */
  const getCurrentAction = useCallback(() => {
    return history[currentIndex];
  }, [history, currentIndex]);

  return {
    addAction,
    undo,
    redo,
    canUndo,
    canRedo,
    isUndoing,
    isRedoing,
    clearHistory,
    getCurrentAction,
    history,
    currentIndex,
  };
}

/**
 * Helper to create undoable actions
 */
export function createUndoableAction<T>(
  type: string,
  description: string,
  data: T,
  undoFn: (data: T) => Promise<void> | void,
  redoFn: (data: T) => Promise<void> | void,
): UndoableAction<T> {
  return {
    type,
    description,
    data,
    undo: () => undoFn(data),
    redo: () => redoFn(data),
  };
}
