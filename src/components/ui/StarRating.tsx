import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
}

export function StarRating({ value, max = 5, size = 16, interactive, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(value);
        const partial = !filled && i < value;
        return (
          <button
            key={i}
            type={interactive ? "button" : undefined}
            onClick={() => interactive && onChange?.(i + 1)}
            className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
          >
            <Star
              width={size}
              height={size}
              className={filled || partial ? "text-amber-400 fill-amber-400" : "text-gray-300 fill-gray-100"}
            />
          </button>
        );
      })}
    </div>
  );
}
