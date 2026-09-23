"use client";

export default function SwitchRoleButton() {
  return (
    <form action="/api/role/clear" method="POST">
      <button
        type="submit"
        className="rounded-lg px-2 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white"
      >
        Switch role
      </button>
    </form>
  );
}
