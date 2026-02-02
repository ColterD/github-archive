import Image from "next/image";


type CardProps = {
    title: string;
    icon?: string;
};

export default function ModeButton({title, icon}: CardProps) {
    return (
        <button className={`flex border-[0.5px] ${icon ? 'rounded-[35px]': 'rounded-[20px]'} p-3 hover:bg-[#D9D9D9] hover:text-black`}>
            {icon && <Image src={icon} alt="icon" width={350} height={350} className="w-8 h-8 mr-2 inline"/>}
            <h2 className="text-3xl">{title}</h2>
        </button>
    )
}