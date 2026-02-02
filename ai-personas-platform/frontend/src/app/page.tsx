"use client"
import React from 'react'
import SelectMode from '@/components/companion/SelectMode'
import HowItWorks from '@/components/howWork/HowItWorks'
import FindCompanion from '@/components/companion/FindCompanion'
import Banner from "@/components/banner";
import Frequently from "@/components/Frequently";
import Footer from "@/components/Footer";
import Options from '@/components/Options'


export default function Page() {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true) }, []);
  if (!isMounted) return null;



  return (
    <div className="w-full h-full flex justify-center ">
      <div className="bg-[#433FED] w-full h-full max-w-7xl flex flex-col gap-14">
        <Banner />
        <SelectMode />
        <HowItWorks />
        <FindCompanion />
        <Options />
        <Frequently />
        <Footer />
      </div>
    </div>
  );
}
