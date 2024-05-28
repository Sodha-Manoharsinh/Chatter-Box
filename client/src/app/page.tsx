import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { Icons } from "@/components/Icons";
import TopicCreator from "@/components/TopicCreator";
import { Star } from "lucide-react";
import DotLoading from "@/components/DotLoading";
import { redis } from "@/lib/redis";

export default async function Home() {
  const servedRequests = await redis.get("served-requests");

  return (
    <section className="min-h-screen bg-grid-zinc-50">
      <MaxWidthWrapper className="relative pb-24 pt-10 sm:pb-32 lg:pt-24 xl:pt-32 lg:pb-52">
        <div className="hidden lg:block absolute inset-0 top-8">
          {/* circle */}
        </div>
        <div className="px-6 lg:px-0 lg:pt-4">
          <div className="relative mx-auto text-center flex flex-col items-center">
            <h1 className="relative loading-snug w-fit tracking-tight text-balance mt-16 font-bold text-gray-900 text-5xl md:text-6xl">
              What do you{" "}
              <span className="whitespace-nowrap">
                th
                <span className="relative">
                  i
                  <span className="absolute inset-x-0 -top-1 -translate-x-2">
                    <Icons.brain className="h-7 w-7 md:h-8 md:w-8" />
                  </span>
                </span>
                nk
              </span>{" "}
              about{<DotLoading></DotLoading>}
            </h1>
            <TopicCreator />
            <div className="mt-12 flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="flex flex-col gap-1 justify-between items-center sm:items-start w-60">
                <div className="flex gap-0.5 mx-auto">
                  <Star className="h-4 w-4 text-green-700 fill-green-500" />
                  <Star className="h-5 w-5 text-green-800 fill-green-500" />
                  <Star className="h-6 w-6 text-green-800 fill-green-600" />
                  <Star className="h-5 w-5 text-green-800 fill-green-500" />
                  <Star className="h-4 w-4 text-green-700 fill-green-500" />
                </div>
                <p className="mx-auto">
                  <span className="font-semibold">
                    {Math.ceil(Number(servedRequests) / 10) * 10}
                  </span>{" "}
                  served requests
                </p>
              </div>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
}
