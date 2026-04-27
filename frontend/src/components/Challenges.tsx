const stats = [
  {
    value: "72%",
    title: "Stuck on manual tasks",
    text: "like leave tracking and chasing invoices instead of focusing on people.",
    color: "#B7D8A4",
    bg: "#EEF7E8",
  },
  {
    value: "58%",
    title: "Struggle to attract",
    text: "and keep talent while managing branding and endless interviews.",
    color: "#F4B6BB",
    bg: "#FDEEEF",
  },
  {
    value: "64%",
    title: "Rely on outdated",
    text: "or scattered data, making decisions without real-time insights they can trust.",
    color: "#E6B558",
    bg: "#FFF3DC",
  },
];

export default function Challenges() {
  return (
    <section
      id="challenges"
      className="bg-[#069EA7] py-16 text-white md:py-20"
    >
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-sm font-semibold">Challenges</p>

        <h2 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight md:text-5xl">
          What’s pulling HR away from what matters?
        </h2>

        <p className="mt-4 max-w-4xl text-sm leading-relaxed text-white/85 md:text-base">
          While HR is meant to drive strategic people, too much of it gets
          trapped in processes. Based on our research, teams waste today’s HR
          teams say pain in three ways.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.value}
              className="rounded-[22px] border-[3px] bg-white p-6 text-slate-900 shadow-[5px_5px_0_rgba(0,0,0,0.18)]"
              style={{ borderColor: item.color }}
            >
              <div
                className="inline-flex rounded-xl px-4 py-2 text-3xl font-bold text-slate-700 md:text-4xl"
                style={{ backgroundColor: item.bg }}
              >
                {item.value}
              </div>

              <p className="mt-8 text-sm font-medium leading-snug text-slate-700 md:text-[15px]">
                <span className="font-extrabold text-slate-900">
                  {item.title}
                </span>{" "}
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}