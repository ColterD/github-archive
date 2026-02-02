"use client"
import React from "react"
import Link from "next/link"
import { PiListBold } from "react-icons/pi"
// import {MdOutlineFormatListBulleted} from "react-icons/Md"
// import {FaListUl} from "react-icons/fa"
import Endata from "@/EnData.json"
import Frdata from "@/FrData.json"
import { useGlobalState } from "@/app/Providers";
import LeftBar from "./LeftBar"
import { useRouter } from "next/navigation"
import AuthHook from "@/hooks/AuthHooks"
import Cookies from "js-cookie";

export default function Header() {
    const { globalLang, setGlobalLang, user, setReload, reload } = useGlobalState();
    const [isMounted, setIsMounted] = React.useState(false);
    const [LeftBarOpen, SetLeftBarOpen] = React.useState(false);
    const authHook = AuthHook()
    const data = globalLang === "En" ? Endata : Frdata;


    const closeLeftBar = () => {
        SetLeftBarOpen(false);
    }
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const loginButton = () => {
        if (user) {
            Cookies.remove('token', { domain: '.colter.dev' });
            setReload(!reload);
        } else {
            authHook.onOpen();
        }
    }

    if (user) console.log(user);

    React.useEffect(() => { }, [globalLang]);

    if (!isMounted)
        return null;
    return (
        <div className="w-full h-16 flex justify-center">
            {LeftBarOpen && <LeftBar onClose={closeLeftBar} />}
            <div className=" bg-[#433FED] w-full max-w-7xl flex xl:rounded-t-[65px] font-semibold text-[14px] xl:px-20 px-6 text-xs sm:text-md">
                <div className="w-3/5">
                    <div className="w-full h-full justify-center items-center space-x-10 md:flex hidden">
                        <Link href={"/#home"}>{data.Header.home}</Link>
                        <Link href={"/#HowItWork"}>{data.Header.howWork}</Link>
                        <Link href={"/#findComp"}>{data.Header.findComp}</Link>
                        <Link href={"/#FAQ"}>{data.Header.faq}</Link>
                    </div>
                    <div className="flex md:hidden text-3xl h-full items-center">
                        <button onClick={() => { SetLeftBarOpen(true) }}>
                            <PiListBold />
                        </button>
                    </div>


                </div>
                <div className="w-2/5 flex justify-end items-center space-x-10">
                    <button onClick={loginButton} className="bg-[#6A67E1] h-2/3 rounded-full shadow-lg border-l-[3px] border-t-[3px]  border-[#7F7CE6] p-2 ">{user ? data.Header.logout : data.Header.start}</button>
                    <button className="h-2/3 rounded-2xl p-2 md:inline hidden" onClick={() => { globalLang == 'En' ? setGlobalLang('Fr') : setGlobalLang('En') }} >{globalLang == 'En' ? 'Fr' : 'En'}</button>

                </div>

            </div>
        </div>
    )
}