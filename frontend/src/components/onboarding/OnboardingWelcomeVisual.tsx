export default function OnboardingWelcomeVisual() {
  return (
    <div className="relative h-64 overflow-hidden rounded-3xl bg-gradient-to-b from-brand-50 via-white to-gray-25 dark:from-brand-950/35 dark:via-gray-900 dark:to-gray-950">
      <span className="absolute start-1/2 top-12 size-48 -translate-x-1/2 rounded-full bg-brand-200/45 blur-3xl rtl:translate-x-1/2 dark:bg-brand-500/15" />
      <span className="absolute -start-10 bottom-2 size-32 rounded-full bg-success-100/60 blur-3xl dark:bg-success-500/10" />

      <div className="absolute start-1/2 top-8 -translate-x-1/2 rtl:translate-x-1/2">
        <div className="onboarding-float relative z-1 rounded-3xl bg-white p-2 shadow-theme-xl dark:bg-gray-900">
          <img
            src="/images/image-gen-3.png"
            alt=""
            width="144"
            height="144"
            className="size-36 rounded-2xl object-cover"
          />
        </div>
      </div>

      <div className="onboarding-float-delayed absolute start-6 top-24 -rotate-6 rounded-2xl bg-success-950 p-2 shadow-theme-lg sm:start-12">
        <img
          src="/images/image-gen-2.png"
          alt=""
          width="72"
          height="72"
          className="size-16 object-contain"
        />
      </div>

      <div className="onboarding-float-slow absolute end-4 top-32 rotate-6 rounded-2xl bg-gray-950 px-3 py-4 shadow-theme-lg sm:end-10">
        <img
          src="/images/image-gen-1.png"
          alt=""
          width="108"
          height="64"
          className="h-14 w-24 object-contain"
        />
      </div>

    </div>
  );
}
