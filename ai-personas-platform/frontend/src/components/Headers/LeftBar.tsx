import { useGlobalState } from "@/app/Providers";
import React, { useEffect } from "react";
import { IoCloseSharp } from "react-icons/io5";
import Endata from "@/EnData.json";
import Frdata from "@/FrData.json";
import Link from "next/link";


interface ILeftBar {
    onClose: () => void;
}

export default function LeftBar({onClose}: ILeftBar) {
    const {globalLang, setGlobalLang} = useGlobalState();
    const data = globalLang === "En" ? Endata : Frdata;
    return (
        <div className="fixed w-full h-full top-0 bg-[#ffffff90] z-50 overflow-y-scroll md:hidden">
            <div className="flex flex-col w-full max-w-[300px] bg-[#433FED] h-full max-h-[800px] rounded-br-3xl">
                <div className="w-full h-[10%] text-5xl flex justify-end items-center p-4">
                    <button className=" hover:text-black" onClick={onClose}> <IoCloseSharp /></button>
                </div>
                <div className="w-full h-[90%] flex flex-col justify-center items-center gap-[100px] font-bold text-2xl">
                    <Link href={"/#home"} className=" border-b-4 border-black  hover:text-black cursor-pointer" onClick={() => {onClose()}}>{data.Header.home}</Link>
                    <Link href={"/#HowItWork"} className="border-b-4 border-black hover:text-black cursor-pointer" onClick={() => {onClose()}}>{data.Header.howWork}</Link>
                    <Link href={"/#findComp"} className="border-b-4 border-black hover:text-black cursor-pointer" onClick={() => {onClose()}}>{data.Header.findComp}</Link>
                    <Link href={"/#FAQ"} className="border-b-4 border-black hover:text-black cursor-pointer" onClick={() => {onClose()}}>{data.Header.faq}</Link>
                    <h2 className=" hover:text-black cursor-pointer" onClick={() => {{globalLang == 'En' ? setGlobalLang('Fr') : setGlobalLang('En')} onClose()}} >{globalLang == 'En' ? 'Fr' : 'En'}</h2>
                </div>
            </div>
        </div>
    );
}
