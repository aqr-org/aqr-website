import Link from "next/link";

interface MonthNavProps {
  entries: {
    [key: string]: unknown[];
  };
}

export default function MonthNav({ entries }: MonthNavProps) {
  return (
    <ul className="flex gap-4 mb-8 flex-wrap">
      {Object.keys(entries).sort((a, b) => {
        // Special sorting for "No Date" group
        if (a === 'No Date') return 1; // No Date last
        if (b === 'No Date') return -1;
        
        // Parse month/year for date-based sorting
        const parseDate = (dateStr: string) => {
          const [month, year] = dateStr.split(' ');
          const monthIndex = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ].indexOf(month);
          return new Date(parseInt(year), monthIndex);
        };
        
        return parseDate(b).getTime() - parseDate(a).getTime(); // Most recent first
      }).map(monthYear => (
        <li key={monthYear} className="text-xl text-qreen-dark font-[700]">
          <Link href={`#${monthYear.replace(/\s+/g, '-').toLowerCase()}`}>
            {monthYear}
          </Link>
        </li>
      ))}
    </ul>
  )
}
