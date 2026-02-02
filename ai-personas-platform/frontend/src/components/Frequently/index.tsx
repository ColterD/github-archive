import Endata from "@/EnData.json";
import Frdata from "@/FrData.json";
import { useGlobalState } from "@/app/Providers";
import DefaultAccordion from "./DefaultAccordion";
import Test from "./file";
import Image from "next/image";
export default function Frequently() {
  const {globalLang} = useGlobalState();
  const data = globalLang === "En" ? Endata : Frdata;
  return (
    <div id="FAQ" className=" w-full flex flex-col gap-10">
      <div className="flex justify-center relative">
        <h2 className=" text-center text-3xl flex flex-row flex-wrap gap-2 font-semibold">
          {data.Frequently.title}
        </h2>
        <div className=" absolute  w-full">
          <Image
            src={"/3DMorphLines.png"}
            alt={"banner-bg"}
            width={1534}
            height={345}
          />
        </div>
      </div>
      <div className="w-full flex flex-col items-center justify-center p-4 relative ">
        <DefaultAccordion data={data.Frequently.Questions}  />
        <div className="shadowbg absolute w-[340px] right-0 -top-4 ">
          <div className="absolute w-[230px] h-[230px]  rounded-full  bg-yellow-500/80 blur-3xl right-1 "></div>

          <div className="absolute w-[230px] h-[230px] rounded-full bg-white/70 blur-3xl left-1 "></div>
        </div>
        <div className=" absolute top-[26rem] md:top-[28rem] w-full">
          <Image
            src={"/3DMorphLines.png"}
            alt={"banner-bg"}
            width={1534}
            height={345}
          />
        </div>
      </div>
    </div>
  );
}
