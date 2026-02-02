import Endata from "@/EnData.json";
import Frdata from "@/FrData.json";
import { useGlobalState } from "@/app/Providers";

export default function Options() {
  const {globalLang} = useGlobalState();
  const data = globalLang === "En" ? Endata : Frdata;
    return (
        <div className="md:mt-28 w-full">
          <div className="hero flex flex-col justify-center items-center w-full">
            <div className="w-full flex justify-center">
              <h2 className=" text-3xl text-center  font-semibold">
                <span className="text-[#E07109] pr-2">
                  {data.ConversationsTypes.title}
                </span>
                {data.ConversationsTypes.subtitle}
              </h2>
            </div>
            <small>{data.ConversationsTypes.disc}</small>
            <div className="flex flex-row p-4 w-full justify-evenly">
              {data.ConversationsTypes.Btns.map((item: any, index: number) => (
                <button
                  key={index}
                  className=" bg-white text-[#433FED] font-bold text-lg py-2 px-4 rounded-full hover:border-[#E07109] border-8 border-white capitalize"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
    )
}