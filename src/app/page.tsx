import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 bg-slate-950 px-6 py-16 text-white">
      <section className="max-w-3xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Save My Wallet</p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Control your financial habits from one place.</h1>
        <p className="mt-4 text-lg text-slate-300">
          We designed a control panel to help you visualize your cards, expenses and goals in real time. Register and keep your
          money aligned with your priorities.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="rounded-2xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            href="/register"
          >
            Create account
          </Link>
        </div>
      </section>
      <div className="w-full max-w-5xl rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur">
        <p className="text-sm text-slate-300">
          Authentication is ready to connect with the API. Once you log in you can see the dashboard and continue developing
          new financial widgets.
        </p>
      </div>
    </div>
  );
}
