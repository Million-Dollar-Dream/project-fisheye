"use client";

export default function SwitchRoleButton() {
  return (
    <form action="/api/role/clear" method="POST">
      <button
        type="submit"
        className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        Switch role
      </button>
    </form>
  );
}
