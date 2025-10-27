import Link from "next/link";

interface AlphabetNavProps {
  entries: {
    [key: string]: unknown[];
  };
}

export default function AlphabetNav({ entries }: AlphabetNavProps) {
  return (
    <ul className="flex gap-4">
      {Object.keys(entries).sort((a, b) => {
          // Special sorting for group keys
          if (a === '0-9') return 1; // Numbers first
          if (b === '0-9') return -1;
          if (a === 'X-Z') return 1; // X-Z last
          if (b === 'X-Z') return -1;
          return a.localeCompare(b); // Regular alphabetical for letters
        }).map(letter => (
        <li key={letter} className="text-xl text-qreen-dark font-[700]">
          <Link href={`#${letter}`}>{letter}</Link>
        </li>
      ))}
    </ul>
  )
}