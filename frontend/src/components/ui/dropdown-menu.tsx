import { useEffect, useRef, useState } from "react";

interface Props {
    items: { [index: string]: () => void };
    text: string;
    className?: string;
    icon?: React.ReactNode;
}

export default function DropdownMenu(props: Props) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const [showMenu, setShowMenu] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                buttonRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            )
                setShowMenu(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setShowMenu(!showMenu)}
                className={`flex items-center gap-2 py-2 px-4 rounded-lg focus:outline-none bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 ${
                    props.className ?? ""
                }`}
            >
                {props.icon}
                {props.text}
                <svg
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                        showMenu ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {showMenu && (
                <div
                    ref={dropdownRef}
                    className="absolute right-0 mt-2 bg-surface border border-border rounded-xl shadow-xl z-10 overflow-hidden animate-[fadeIn_0.15s_ease-out]"
                >
                    <ul className="py-1">
                        {Object.entries(props.items).map(([key, value]) => (
                            <li
                                key={key}
                                onClick={value}
                                className="px-4 py-2 text-slate-700 hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors duration-150"
                            >
                                {key}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
