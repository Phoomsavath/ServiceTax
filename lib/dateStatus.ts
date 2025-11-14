export function getExpiryStatus(expiryAt: string | Date) {
  const expiry = new Date(expiryAt);
  const now = new Date();
  const diffDays = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return { text: "Expired", color: "text-red-600", daysLeft: 0 };
  } else if (diffDays <= 7) {
    return {
      text: `${diffDays} days left`,
      color: "text-red-500",
      daysLeft: diffDays,
    };
  } else if (diffDays <= 15) {
    return {
      text: `${diffDays} days left`,
      color: "text-yellow-500",
      daysLeft: diffDays,
    };
  } else {
    return {
      text: `${diffDays} days left`,
      color: "text-green-500",
      daysLeft: diffDays,
    };
  }
}
