import DarkLightToggle from "@/components/DarkLightToggle";
import Image from "next/image";

export default function Home() {
  return (
    <main className=" font-bold w-full h-screen relative">
      <div className="flex flex-col gap-10 items-center justify-center h-full">
        <h1 className="text-6xl">Adding dark mode switcher</h1>
        <h2 className="text-4xl">
          using{" "}
          <span className=" rounded p-2 bg-muted-foreground text-white">
            shadcn
          </span>
        </h2>
        <DarkLightToggle />
      </div>
    </main>
  );
}
