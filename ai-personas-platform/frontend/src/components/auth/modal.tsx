"use client";

import React from "react";
import { IoCloseSharp } from "react-icons/io5";
import authHook from "@/hooks/AuthHooks"
interface props {
  body: React.ReactNode;
  IsOpen: boolean;
  OnClose: () => void;
  heading: string;
}

export default function ModaL(props: props) {
  const [IsMounted, setMounted] = React.useState<boolean>(false);
  const [showModal, setshowModal] = React.useState<boolean>(props.IsOpen);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setshowModal(props.IsOpen);
  }, [props.IsOpen]);

  // Functions :
  if (!IsMounted) return;
  if (!props.IsOpen) return;
  return (
    <div className="ModaL ">
      <div className="ModaLContect rounded-3xl max-w-xl">
      <div className=" absolute top-6 right-6">
        <button className="text-4xl " onClick={props.OnClose}><IoCloseSharp /></button>
      </div>
        {props.body}
        </div>
    </div>
  );
}
