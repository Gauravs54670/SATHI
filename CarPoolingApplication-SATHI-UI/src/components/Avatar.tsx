"use client";

import Image from "next/image";

interface AvatarProps {
  name?: string;
  email?: string;
  imageUrl?: string;
  size?: number;
  onClick?: () => void;
  className?: string;
}

// Gradient colors for letter avatars based on first character
const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-600",
  "from-fuchsia-500 to-purple-500",
];

function getGradient(letter: string): string {
  const index = letter.toUpperCase().charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[index];
}

export default function Avatar({ name, email, imageUrl, size = 40, onClick, className = "" }: AvatarProps) {
  // Get the first letter from name or email
  const letter = (name?.[0] || email?.[0] || "?").toUpperCase();
  const gradient = getGradient(letter);

  return (
    <div
      onClick={onClick}
      className={`relative rounded-full overflow-hidden flex items-center justify-center cursor-pointer
        transition-all duration-200 hover:ring-2 hover:ring-indigo-400/50 hover:scale-105 ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name || "Profile"}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white font-bold`}
          style={{ fontSize: size * 0.4 }}
        >
          {letter}
        </div>
      )}
    </div>
  );
}
