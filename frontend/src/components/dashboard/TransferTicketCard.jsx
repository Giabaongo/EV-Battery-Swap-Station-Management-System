import React from 'react'

export default function TransferTicketCard({
    type, // 'import' | 'export'
    stationLabel,
    fromStation,
    toStation,
    quantity,
    model,
    buttonText,
    onConfirm,
    borderColor,
    icon,
    iconColor
}) {
    return (
        <div className={`flex flex-col items-stretch justify-start rounded-lg border-2 ${borderColor} bg-white dark:bg-gray-900 shadow-sm min-h-[220px]`}>
            <div className="flex w-full grow flex-col items-stretch justify-between gap-4 p-6">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <i className={`${icon} ${iconColor}`}></i>
                        <p className={`${iconColor} text-sm font-bold leading-normal tracking-wider`}>{type.toUpperCase()}</p>
                    </div>
                    <p className="text-[#212529] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">{stationLabel}</p>
                    <div className="flex flex-col gap-1">
                        <p className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal">From: {fromStation}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal">To: {toStation}</p>
                        <p className="text-gray-600 dark:text-gray-300 text-base font-normal leading-normal">Quantity: {quantity} | Model: {model}</p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={onConfirm}
                        className="flex min-w-[84px] max-w-sm cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary text-white text-sm font-medium leading-normal hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <span className="truncate">{buttonText}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
