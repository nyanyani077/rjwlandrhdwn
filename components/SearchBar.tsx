"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChange, placeholder }: Props) {
  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor="place-search" className="sr-only">
        음식점·메뉴 검색
      </label>
      <input
        id="place-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "이름, 메뉴, 태그로 검색"}
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 pr-10 text-stone-900 shadow-sm outline-none ring-stone-400/30 placeholder:text-stone-400 focus:border-amber-500/60 focus:ring-2"
      />
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
        aria-hidden
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </span>
    </div>
  );
}
