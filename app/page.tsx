import { messageTranslation } from "@/lib/constant";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8">
        <section className="text-center space-y-3">
          <h1 className="text-4xl font-bold">Welcome back Web Service Tax!</h1>
          <p className="text-gray-600 text-lg">
            Here's an overview of your system
          </p>
        </section>
      </div>
    </main>
  );
}
