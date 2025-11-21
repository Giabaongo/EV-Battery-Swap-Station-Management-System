export default function TransactionSearchBar({ value, onChange, placeholder = "Search transactions..." }) {
    return (
        <div className="relative w-full md:w-64">
            <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                search
            </span>
            <input
                className="h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 pl-10 pr-4 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder={placeholder}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
