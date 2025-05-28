// ✅ 完了状態を localStorage で管理
export const getCompletedTasks = (): Record<string, boolean> => {
  if (typeof window === "undefined") return {};
  const completed = localStorage.getItem("completed_tasks");
  return completed ? JSON.parse(completed) : {};
};

export const saveCompletedTasks = (completed: Record<string, boolean>) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("completed_tasks", JSON.stringify(completed));
}; 