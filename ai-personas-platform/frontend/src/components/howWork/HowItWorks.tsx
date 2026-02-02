import Endata from "@/EnData.json"
import Frdata from "@/FrData.json"
import Step from "./Step"
import Light from "../Light"
import { useGlobalState } from "@/app/Providers"

export default function HowItWorks() {
    const {globalLang} = useGlobalState();
    const data = globalLang === "En" ? Endata : Frdata;
    return (
        <div id="HowItWork" className=" w-full flex flex-col justify-center items-center">
            <Light top={-40} />
            <div className=" font-bold text-xl md:text-4xl p-2 ">{data.HowWork.title}</div>
            <Step title={data.HowWork.Create} desc={data.HowWork.CreateDes} image="/01.png" type="left"/>
            <Light right={0} top={-40} mobilehidden={true} />
            <Step title={data.HowWork.Choose} desc={data.HowWork.ChooseDes} image="/02.png" type="right"/>
            <Light top={-40} />
            <Step title={data.HowWork.Chat} desc={data.HowWork.ChatDes} image="/03.png" type="left"/>
            <Light right={0} />
        </div>
    )
}