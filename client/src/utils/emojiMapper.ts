export const habitEmojiMap: Record<string, string> = {
  Health: "🏃‍♂️",
  Fitness: "💪",
  Nutrition: "🥗",
  Hydration: "💧",
  Learning: "📚",
  Writing: "🖋️",
  Productivity: "✅",
  Planning: "📅",
  Focus: "⏳",
  Mindfulness: "🌿",
  Meditation: "🧘‍♂️",
  Energy: "⚡",
  Sleep: "😴",
  Creative: "🎨",
  Social: "👥",
  Financial: "💰",
  Career: "💼",
  Personal: "🌟",
  Spiritual: "🙏",
  Family: "👨‍👩‍👧‍👦",
  Hobby: "🎯"
};

export const getHabitEmoji = (category: string): string => {
  return habitEmojiMap[category] || "⭐";
};
