import Endata from "@/EnData.json"
import Frdata from "@/FrData.json"
import PlaySound from "./PlaySound"
import CompanionCard from "./CompanionCard"
import Light from "../Light"
import { useGlobalState } from "@/app/Providers"

export default function FindCompanion() {
    const {globalLang} = useGlobalState();
    const data = globalLang === "En" ? Endata : Frdata;
    return (
        <div id="findComp" className=" w-full flex flex-col justify-center items-center h-full pt-1">
            <div className=" font-bold text-xl md:text-4xl p-2 ">{data.FindCompanion.title}</div>
            <div className="w-full h-full justify-center items-center grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-12 p-12">
                {data.FindCompanion.Companion.map((item:any, index:number ) => (
                    <div className="w-full h-full max-w-[350px] max-h-[480px]" key={index}>
                        <CompanionCard key={index} name={item.name} imagePath={item.img} soundPath={item.Sound}/>
                    </div>
                ))}
            </div>
            <Light left={0} top={-40} hidden={true} />
        </div>
    )
}