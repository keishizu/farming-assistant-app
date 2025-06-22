import { SupabaseClient } from "@supabase/supabase-js";

export const getCompletedTasks = async (
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, boolean>> => {
  const { data, error } = await supabase
    .from("completed_tasks")
    .select("*")
    .eq("user_id", userId);

  if (error) return {};
  return data.reduce((acc, task) => ({ ...acc, [task.task_id]: true }), {});
};

export const saveCompletedTasks = async (
  supabase: SupabaseClient,
  userId: string,
  completed: Record<string, boolean>
): Promise<void> => {
  const tasks = Object.entries(completed).map(([taskId, isCompleted]) => ({
    user_id: userId,
    task_id: taskId,
    completed: isCompleted,
  }));

  await supabase.from("completed_tasks").upsert(tasks);
}; 