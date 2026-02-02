"use client"
import React, { useEffect } from 'react'
import Endata from '@/EnData.json'
import Frdata from '@/FrData.json'
import dynamic from 'next/dynamic';
import { useGlobalState } from '@/app/Providers';
import Light from '../Light';
import { HiOutlineMail } from 'react-icons/hi';

const ScrollCarousel = dynamic(() => import('@/components/companion/ScrollCarousel'), { ssr: false });


export default function SelectMode() {
    const {globalLang} = useGlobalState();
    const data = globalLang === "En" ? Endata : Frdata;
    const [isMounted, setIsMounted] = React.useState(false);
    useEffect(() => {setIsMounted(true)}, []);
    if (!isMounted) return null;
return (
    <div className=" w-full flex flex-col items-center justify-center py-4 space-y-10 z-30">
        <div className="border border-[#6461F0] rounded-full p-6 px-12 max-w-2xl text-center font-semibold bg-[#433FED] shadow-2xl text-2xl">
        {data.SelectMode.title}
        </div>
        <Light right={0} hidden={true} />
        <div className='slider w-full flex justify-center flex-col space-y-10 overflow-hidden'>
        {/* <div className="w-full bg-[#D9D9D9] rounded-3xl flex justify-center hover:bg-[#D9D9D9d9]">
            <div className=" text-4xl p-3 flex justify-end items-center text-[#535353]">
            <HiOutlineMail/>
            </div>
            <div className="w-full rounded-3xl outline-none ">
            <input
              className=" outline-none border-none"
            />
            </div>
          </div> */}
            <ScrollCarousel data={data.SelectMode.list}/>
            <ScrollCarousel data={data.SelectMode.list} directio="rtl"/>
            <ScrollCarousel data={data.SelectMode.list}/>
        </div>
    </div>
)
}
