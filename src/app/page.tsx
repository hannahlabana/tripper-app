import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-4xl font-extrabold font-inter">
          welcome to tripper
      </h1>
      <Link
        className="bg-blue-500 text-white px-6 py-2 rounded-lg font-inter cursor-pointer hover:bg-blue-700 transition-all duration-300"
        href="/form"
      >
          Get Started
      </Link>
    </div>
  );
}
