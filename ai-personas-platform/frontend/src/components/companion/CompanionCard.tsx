import PlaySound from "./PlaySound"
import Image from "next/image";

interface Props {
    imagePath: string;
    name: string;
    soundPath: string;
}

export default function CompanionCard({imagePath, name, soundPath}: Props ) {
    return (
        <div className="relative flex justify-center items-center w-full h-full rounded-lg">
            <div className="w-full h-full rounded-lg overflow-hidden">
                <Image src={imagePath} alt="1" width={350} height={480} />
            </div>
            <div className=" absolute top-2 left-2 border px-6 rounded-3xl text-3xl font-semibold bg-[#ededea20] backdrop-blur-md">
                {name}
            </div>
            <div className=" absolute bottom-4 border border-[#EDEDEA50] w-11/12 h-1/6 bg-[#ededea20] rounded-[3rem] flex justify-center items-center backdrop-blur-md overflow-hidden px-3">
                <div className=" w-full h-full cursor-pointe">
                <PlaySound soundPath={soundPath}/>
                </div>
            </div>
        </div>
    )
}
