import { useState } from "react";
import { Button } from "./ui/button";

interface WhatsAppShareButtonProps {
  userLevel?: number;
  totalXP?: number;
  currentStreak?: number;
  longestStreak?: number;
  completedHabits?: number;
  totalHabits?: number;
  userName?: string;
  className?: string;
}

export function WhatsAppShareButton({ 
  userLevel = 1, 
  totalXP = 0, 
  currentStreak = 0, 
  longestStreak: _longestStreak = 0,
  completedHabits = 0,
  totalHabits = 0,
  userName = "I",
  className = ""
}: WhatsAppShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const generateShareMessage = () => {
    const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
    
    // Clean, professional messaging without emojis
    let message = `*${userName} is building amazing habits with HabitLoop!*\n\n`;
    
    // Add personalized achievements
    const achievements = [];
    
    if (currentStreak >= 7) {
      achievements.push(`*${currentStreak} day streak* - I'm on fire!`);
    } else if (currentStreak >= 3) {
      achievements.push(`*${currentStreak} day streak* - momentum building!`);
    } else if (currentStreak > 0) {
      achievements.push(`*${currentStreak} day streak* - getting started!`);
    }
    
    if (userLevel >= 5) {
      achievements.push(`*${totalXP} XP* - habit master!`);
    } else if (userLevel >= 3) {
      achievements.push(`*${totalXP} XP* - leveling up!`);
    } else if (userLevel > 1) {
      achievements.push(`*${totalXP} XP* - growing strong!`);
    }
    
    if (completionRate >= 80) {
      achievements.push(`*${completionRate}% completion rate* - crushing it!`);
    } else if (completionRate >= 50) {
      achievements.push(`*${completionRate}% completion rate* - making progress!`);
    } else if (completionRate > 0) {
      achievements.push(`*${completionRate}% completion rate* - every step counts!`);
    }
    
    if (achievements.length > 0) {
      message += achievements.join('\n') + '\n\n';
    }
    
    // Motivational closing with user's name
    if (userLevel >= 5) {
      message += `*${userName}* is becoming the person they want to be, one habit at a time! Who's ready to level up with ${userName}?\n\n`;
    } else if (userLevel >= 3) {
      message += `*${userName}* is building better habits and feeling unstoppable! Ready to join the journey?\n\n`;
    } else {
      message += `*${userName}* is starting their habit journey and already seeing results! Want to build habits together?\n\n`;
    }
    
    message += `Try HabitLoop: techversehublk.site\n`;
    message += `#HabitLoop #HabitBuilding #PersonalGrowth`;

    return message;
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const message = generateShareMessage();
      
      // Use the universal WhatsApp API that supports:
      // - WhatsApp Web (browser)
      // - WhatsApp Desktop (Microsoft Store)
      // - WhatsApp Mobile (if installed)
      // - "Continue to Chat" for users without WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      
      // Open in new tab/window
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      
      // Optional fallback: copy to clipboard (only if permission is granted)
      try {
        if (navigator.clipboard && navigator.permissions) {
          // Check if clipboard permission is granted
          const permission = await navigator.permissions.query({ name: 'clipboard-write' as PermissionName });
          if (permission.state === 'granted') {
            await navigator.clipboard.writeText(message);
          }
        }
      } catch (clipboardError) {
        // Silently ignore clipboard errors - WhatsApp opening is the main feature
        console.log('Clipboard fallback not available:', clipboardError);
      }
      
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // const getMotivationalMessage = () => {
  //   if (currentStreak >= 7) {
  //     return "🔥 Streak Master!";
  //   } else if (userLevel >= 5) {
  //     return "📈 Habit Master!";
  //   } else if (userLevel >= 3) {
  //     return "🌟 Leveling Up!";
  //   } else if (completedHabits >= 3) {
  //     return "✅ Habit Hero!";
  //   } else if (userLevel > 1) {
  //     return "🚀 Growing Strong!";
  //   } else {
  //     return "🎯 Getting Started!";
  //   }
  // };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      className={className}
    >
      {isSharing ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          Sharing...
        </>
      ) : (
        <>
          <i className="fab fa-whatsapp mr-2"></i>
          Share on WhatsApp
        </>
      )}
    </Button>
  );
}
