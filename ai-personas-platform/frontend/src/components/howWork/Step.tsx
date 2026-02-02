import Image from "next/image";


interface StepProps {
    title: string;
    desc: string;
    image: string;
    type: string;
}

export default function Step({title, desc, image, type}: StepProps) {
    return (
        <div>
            {type === "left" ?
            <div className=" w-full flex md:mb-28 z-20">
                <div className="w-1/3  flex justify-center items-center  ">
                    <Image src={image} alt="1" width={350} height={350} className="w-4/5 max-h-[400px] sm:max-w-[300px] z-20"/>
                </div>
                <div className="w-2/3 p-4 md:p-10 ">
                    <h1 className=" text-[14] md:text-2xl font-bold py-4 border-b-4">{title}</h1>
                    <p className="py-4 text-[12px] md:text-lg">{desc}</p>
                </div>
            </div>
            :
            <div className=" w-full flex md:mb-28 z-20">
                <div className="w-2/3 p-4 md:p-10 ">
                    <h1 className=" text-[14] md:text-2xl font-bold py-4 border-b-4">{title}</h1>
                    <p className="py-4 text-[12px] md:text-lg">{desc}</p>
                </div>
                <div className="w-1/3  flex justify-center items-center  ">
                    <Image src={image} width={350} height={350} alt="1" className="w-4/5 max-h-[400px] sm:max-w-[300px] z-20"/>
                </div>
            </div>

        }

        </div>
    )
}