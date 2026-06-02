"use client";

export type Goal = {
  readonly key: string;
  readonly label: string;
  readonly current: number;
  readonly target: number;
  readonly unit: string;
};

/**
 * 3 horizontal progress bars — "you're X% of the way to Y this month".
 * Saffron gradient fills. Saturates at 100% with an "ok" badge.
 */
export function GoalsProgress({ goals }: { goals: ReadonlyArray<Goal> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/40 backdrop-blur">
      <div className="border-b border-line px-5 py-3">
        <h3 className="font-display text-sm font-medium text-bone">Goals this month</h3>
        <p className="mt-0.5 font-mono text-[11px] text-mute">
          Soft targets to keep you shipping
        </p>
      </div>

      <ul className="space-y-5 p-5">
        {goals.map((g) => (
          <GoalRow key={g.key} goal={g} />
        ))}
      </ul>
    </div>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  const pct = goal.target === 0 ? 0 : Math.min(1, goal.current / goal.target);
  const done = pct >= 1;
  return (
    <li>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs text-bone">{goal.label}</span>
        <span className="font-mono text-[11px] text-mute">
          <span className={done ? "text-ok" : "text-bone"}>{goal.current}</span>{" "}
          / {goal.target} {goal.unit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-[var(--ease-spring)] ${
            done
              ? "bg-gradient-to-r from-ok to-ok"
              : "bg-gradient-to-r from-signal to-signal/70"
          }`}
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
    </li>
  );
}
