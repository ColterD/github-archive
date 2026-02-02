import Image from "next/image";
import Endata from "@/EnData.json";
import Frdata from "@/FrData.json";
import Link from "next/link";
import { useGlobalState } from "@/app/Providers";
interface ITitle {
  name: string;
}
interface IBody {
  body: any[];
}
function Title({ name }: ITitle) {
  return (
      <h1 className=" text-base sm:text-2xl ">{name}</h1>
  );
}
function Body({ body }: IBody) {
  return (
    <div className="flex flex-col text-xs sm:text-base font-think gap-1">
      {body.map((item: any, index: number) => (
        <Link key={index} href={item.link}>
          {item.title}
        </Link>
      ))}
    </div>
  );
}

export default function Footer() {
  const {globalLang} = useGlobalState();
  const data = globalLang === "En" ? Endata : Frdata;
  return (
    <div className="md:mt-[5rem] w-full p-2 md:p-4 flex flex-col gap-6">
      <div className=" flex-col-reverse sm:flex-row  flex w-full gap-7 ">
        <div
          className="flex flex-row  gap-2 items-center  w-full justify-around
                    sm:flex-col   sm:w-1/6 
                    md:gap-4 md:flex-row md:justify-center  md:w-2/6"
        >
          <Image
            src={data.footer.wireTransfer}
            alt={"wire-transfer"}
            width={50}
            height={50}
          />
          <Image
            src={data.footer.paypal}
            alt={"paypal"}
            width={50}
            height={50}
          />
          <Image src={data.footer.visa} alt={"visa"} width={50} height={50} />
        </div>
        <div className=" flex justify-between w-full sm:w-4/6 p-4 break-words gap-1">
          <div className="flex flex-col gap-4">
            <Title name={data.footer.about.title} />
            <Body body={data.footer.about.options} />
          </div>
          <div className="flex flex-col gap-4">
            <Title name={data.footer.contact.title} />
            <Body body={data.footer.contact.options} />
          </div>
          <div className="flex flex-col gap-4">
            <Title name={data.footer.Services.title} />
            <Body body={data.footer.Services.options} />
          </div>
        </div>
      </div>

      <div className=" flex justify-between items-end h-full">
        <div className="flex flex-row gap-2 text-[10px] font-normal">
          <Link href={""}>{data.footer.RefundPolicy.label}</Link>
          <Link href={""}>{data.footer.PrivacyPolicy.label}</Link>
          <Link href={""}>{data.footer.TermsConditions.label}</Link>
        </div>
        <div className="">
          <h3 className="text-center text-xs sm:text-base">© 2022 Logo . All Rights Reserved.</h3>
        </div>
      </div>
    </div>
  );
}
