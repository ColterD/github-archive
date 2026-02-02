import Image from "next/image";
import Endata from "@/EnData.json";
import Frdata from "@/FrData.json";
import { useGlobalState } from "@/app/Providers";
import { IconType } from "react-icons";
import CardProfile from "./CardProfile";
import { FaHandPointer, FaRegHandPointer } from "react-icons/fa6";
import {useRouter} from "next/navigation";
import Light from "../Light";

interface Ibanner {}
export default function Banner({}: Ibanner) {
  const router = useRouter();
  const {globalLang} = useGlobalState();
  const data = globalLang === "En" ? Endata : Frdata;
  return (
    <>
      <div id="home" className=" relative w-full mt-11 flex flex-col gap-8">
        <div className=" relative w-full  ">
          <div className=" relative  bannerContent flex md:flex-row justify-between flex-col-reverse p-4 gap-[2rem] lg:gap-[5rem]">
            <div className=" w-1/3  hidden md:flex flex-col p-2 justify-center items-center gap-4 relative">
              {/* <CardProfileMobile w-[870px]
            heroImage={"/banner/image__banner_01.webp"}
            name={"sara 1"}
            // Icon={FaHandPointer}
            maxWidth={250}
          /> */}
              <div className="shadowbg absolute w-[340px] right-0 top-0 ">
                <div className="absolute w-[230px] h-[230px]  rounded-full  bg-yellow-500/80 blur-3xl right-1 "></div>

                <div className="absolute w-[230px] h-[230px] rounded-full bg-white/70 blur-3xl left-1 "></div>
              </div>

              <div className=" flex flex-col  justify-center items-center h-full w-full ">
                <div className=" absolute top-[40px]  z-0 left-[20%] right-[22%] cursor-pointer" onClick={() => {router.replace("/#findComp")}}>
                  <CardProfile
                    zIndex={0}
                    heroImage={"/profile/NewSarah.png"}
                    name={"New"}
                    // Icon={FaHandPointer}
                    maxWidth={250}
                  />
                </div>
                <div className=" absolute top-[144px]  z-10 left-[45%] cursor-pointer" onClick={() => {router.replace("/#findComp")}}>
                  <CardProfile
                    zIndex={3}
                    heroImage={"/profile/NewSarah2.png"}
                    name={"Ava"}
                    // Icon={FaHandPointer}
                    maxWidth={250}
                  />
                </div>
                <div className=" absolute top-[110px] right-[45%] cursor-pointer" onClick={() => {router.replace("/#findComp")}}>
                  <CardProfile
                    zIndex={2}
                    heroImage={"/profile/Newlala.png"}
                    name={"Lala"}
                    // Icon={FaHandPointer}
                    maxWidth={250}
                  />
                </div>
              </div>
            </div>
            <div className="flex w-full md:w-2/3 flex-col gap-20">
              <div className="hero">
                <h2 className=" text-5xl flex flex-col font-semibold">
                  {data.Banner.title}
                  <span className="text-[#E07109]">{data.Banner.subTitle}</span>
                </h2>
              </div>
              <div className=" flex w-full gap-6 justify-center">
                <div className="bannerDisc w-3/5 hidden sm:flex">
                  <p>{data.Banner.disc}</p>
                </div>
                <div className=" relative max-w-[190px] sm:max-w-[258px] md:max-w-[278px]  z-[1] w-full h-full">
                  <Image
                    src={"/banner/3d.png"}
                    alt={"banner-bg"}
                    width={700}
                    height={700}
                  />
                  {/* <img src={"/object0.png"} className="" alt={"banner-bg"} /> */}
                  <div className=" max-w-3/5 w-full h-full absolute flex ">
                    {/* <Image
                  src={"/object0.svg"}
                  alt={"banner-bg"}
                  width={678}
                  height={678}
                /> */}

                    {/* <img src={""} className="" alt={"banner-bg"} /> */}
                  </div>
                </div>
              </div>

              <div className="shadowbg absolute w-[340px] right-0 top-[16rem] ">
                <div className="absolute w-[230px] h-[230px]  rounded-full  bg-yellow-500/80 blur-3xl right-1 "></div>

                <div className="absolute w-[230px] h-[230px] rounded-full bg-white/70 blur-3xl left-1 "></div>
              </div>
            </div>
          </div>
          <div className=" absolute top-[26rem] md:top-[28rem] w-full">
            <div className=" hidden md:block top-[50%] z-20 h-[84px] absolute left-20 ">
              <button className="bg-[#e07109ee] p-[5px]   px-[10px] rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#e07109]  ">
                {data.Header.start}
              </button>
            </div>
            <Image
              src={"/3DMorphLines.png"}
              alt={"banner-bg"}
              width={1534}
              height={345}
            />
            {/* <img src={"/3DMorphLines.png"} alt={"banner-bg"} /> */}
          </div>
        </div>
        <div className="flex  md:hidden ">
          <div className="cadrss flex p-2 w-full  mt-16">
            <div className="flex flex-row w-full h-full justify-around relative">
              <div className=" absolute top-10 sm:top-16  z-0 left-[12%] right-[53.5%] sm:left-[10%] sm:right-[56%] cursor-pointer" onClick={() => {router.replace("/#findComp")}}>
                <CardProfile
                  zIndex={0}
                  heroImage={"/banner/image__banner_01.webp"}
                  name={"sara 1"}
                  // Icon={FaHandPointer}
                  maxWidth={250}
                />
              </div>
              <div className=" absolute top-10 sm:top-14 z-10 right-[12%] left-[53.5%] sm:right-[10%] sm:left-[56%] cursor-pointer" onClick={() => {router.replace("/#findComp")}}>
                <CardProfile
                  zIndex={0}
                  heroImage={"/banner/image__banner_01.webp"}
                  name={"sara 2"}
                  // Icon={FaHandPointer}
                  maxWidth={250}
                />
              </div>
              <div className=" absolute -top-1   z-10 right-[28%] left-[28%] cursor-pointer" onClick={() => {router.replace("/#findComp")}}>
                <CardProfile
                  zIndex={0}
                  heroImage={"/banner/image__banner_01.webp"}
                  name={"sara 3"}
                  Icon={FaHandPointer}
                  maxWidth={450}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full  md:hidden flex  p-4 justify-center items-center">
        <button className="bg-[#e07109ee] p-[5px]   px-[10px] rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#e07109]  ">
          {data.Header.start}
        </button>
      </div>
    </>
  );
}
