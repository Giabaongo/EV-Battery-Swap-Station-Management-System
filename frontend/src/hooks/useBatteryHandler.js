// Pure color helpers for BatteryCard (light mode)
export const getStatusBadgeColor = (status) => {
  // Use raw status from backend, no mapping
  const colors = {
    charging: "bg-yellow-500 text-black",
    full: "bg-green-500 text-white",
    in_use: "bg-blue-500 text-white",
    booked: "bg-orange-500 text-white",
    defective: "bg-red-500 text-white",
  };
  return colors[status] || "bg-gray-400 text-gray-900";
};

export const getChargeBarColor = (percentage) => {
  if (percentage >= 80) return "bg-green-500";
  if (percentage >= 50) return "bg-yellow-400";
  if (percentage >= 20) return "bg-orange-400";
  return "bg-red-400";
};

export const getSOHBarColor = (soh) => {
  if (soh >= 90) return "bg-green-600";
  if (soh >= 80) return "bg-yellow-500";
  if (soh >= 60) return "bg-orange-500";
  return "bg-red-500";
};
