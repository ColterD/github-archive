"use client";

import { Accordion } from "flowbite-react";
import React from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import Endata from "@/EnData.json";
import Frdata from "@/FrData.json";
import { useGlobalState } from "@/app/Providers";

interface IAccordionItem {
  data: any;
  last: boolean;
}
function DefaultAccordionItem({ data, last }: IAccordionItem) {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  return (
    <>
      <h2 id="accordion-flush-heading-1" className="p-4">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
          className={`flex items-center justify-between w-full py-5 font-medium text-left text-gray-500 ${ !last ?'border-b' : ''} border-gray-200 dark:border-gray-700 dark:text-gray-400`}
        >
          <span className={`${isOpen ? "text-[#B437DB]" : ""}`}>
            {data.questions}
          </span>
          {isOpen ? (
            <AiOutlineMinus
              className={` font-semibold text-lg text-[#4A3AFF]`}
            />
          ) : (
            <AiOutlinePlus className={` font-semibold text-lg`} />
          )}
        </button>
      </h2>
      <div
        id="accordion-flush-body-1"
        className={`${isOpen ? "flex" : "hidden"} `}
      >
        <div className="py-5 border-b border-gray-200 dark:border-gray-700">
          <p className="mb-2 text-gray-500 dark:text-gray-400">{data.resp}</p>
        </div>
      </div>
    </>
  );
}
interface IAccordion {
  data: any[];
}
export default function DefaultAccordion({  }: IAccordion) {
  const {globalLang} = useGlobalState();
  const [IsMounted, setMounted] = React.useState<boolean>(false);
  const data = globalLang === "En" ? Endata : Frdata;

  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!IsMounted) return;
  return (
    <div className=" max-w-[878px] w-full bg-white z-[2]  rounded-md p-4 h-full">
      {data.Frequently.Questions.map((item: any, index: number) => (
        <DefaultAccordionItem
          key={index}
          last={data.Frequently.Questions.length === index + 1}
          data={item}
        />
      ))}
    </div>
  );
}
