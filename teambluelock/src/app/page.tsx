import EnvTest from "@/components/EnvTest";
import DatabaseTest from "@/components/DatabaseTest";

export default function Home() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-semibold text-sky-600 tracking-wide drop-shadow-md">
          Team Blue Lock – Hello World!
        </h1>
        <p className="mt-2 text-white-600">
          This is your main overview page. You can keep environment and database
          checks here while you build out the rest.
        </p>
      </header>

      {/* Commented this out only for the Alpha Demo */}

      {/* <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-3">Environment Check</h2>
          <EnvTest />
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-3">Database Check</h2>
          <DatabaseTest />
        </div>
      </section> */}
    </div>
  );
}