export default function TransactionTimeFilter({ value, onChange }) {
    const options = ['day', 'week', 'month', 'year'];

    return (
        <div className="flex w-full md:w-auto">
            <div className="flex h-10 w-full flex-1 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                {options.map((option) => (
                    <label
                        key={option}
                        className="flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-4 text-sm font-medium leading-normal has-[:checked]:bg-white dark:has-[:checked]:bg-gray-700 has-[:checked]:text-gray-900 dark:has-[:checked]:text-white text-gray-500 dark:text-gray-400 has-[:checked]:shadow-sm"
                    >
                        <span className="truncate capitalize">{option}</span>
                        <input
                            className="invisible w-0"
                            name="time-filter"
                            type="radio"
                            value={option}
                            checked={value === option}
                            onChange={(e) => onChange(e.target.value)}
                        />
                    </label>
                ))}
            </div>
        </div>
    );
}
