"use client";
import { useTheme } from "next-themes";
import { IoMoonSharp, IoSunnySharp } from "react-icons/io5";
import { Button } from "./ui/button";

export default function DarkLightToggle() {
  const { setTheme } = useTheme();
  return (
    <div className="flex gap-10 text-4xl mt-10">
      <Button
        size={"lg"}
        className=" hover:cursor-pointer"
        onClick={() => setTheme("dark")}
      >
        <IoMoonSharp className="size-6!" />
      </Button>
      <Button
        size={"lg"}
        className="hover:cursor-pointer"
        onClick={() => setTheme("light")}
      >
        <IoSunnySharp className="size-6!" />
      </Button>
    </div>
  );
}
