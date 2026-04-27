import one from '@/assets/solution-1.webp';
import two from '@/assets/solution-2.webp';
import three from '@/assets/solution-3.webp';

const cards = [
  {
    title: 'Free HR from Paperwork',
    desc: 'Automate leave, attendance, and payroll — making time for what truly matters.',
    img: one,
  },
  {
    title: 'Decisions with Clarity',
    desc: 'See real-time, reliable data so you can lead with confidence, not guesswork.',
    img: two,
  },
  {
    title: 'HR that Scales Gracefully',
    desc: 'From 10 to 1,000 people, HQ grows smoothly with your team’s needs.',
    img: three,
  },
];

export default function Solutions() {
  return (
    <section className="bg-[#0E5961] py-20 text-white">
      <div className="mx-auto max-w-6xl px-5 text-center">
        
        <p className="text-sm font-semibold text-[#F6B24B]">
          The Solution
        </p>

        <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">
          Redefining HR Management with <br />
          Seamless Solutions
        </h2>

        <p className="mx-auto mt-5 max-w-3xl text-sm text-white/80 md:text-base">
          HQ HR management was designed to tackle the everyday challenges HR teams
          face by unifying essential HR functions in one elegant system.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-[#124F56] p-6 text-center shadow-[0_6px_0_rgba(0,0,0,0.25)]"
            >
              {/* Illustration container */}
              <div className="mx-auto flex h-40 w-full items-center justify-center rounded-xl bg-white/5 p-4">
                <img
                  src={card.img}
                  alt={card.title}
                  className="h-full object-contain"
                />
              </div>

              <h3 className="mt-6 text-lg font-extrabold md:text-xl">
                {card.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-white/80">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}