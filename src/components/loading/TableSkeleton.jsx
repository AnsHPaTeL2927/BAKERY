import Skeleton from "./Skeleton";

export default function TableSkeleton({ columns = 5, rows = 10, theme = "public" }) {
  const borderClass = theme === "admin" ? "border-admin-border/60" : "border-blush/30";

  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className={`border-b ${borderClass} last:border-0`}>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-5 py-3.5">
              <Skeleton theme={theme} className="h-4 w-full max-w-40" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
