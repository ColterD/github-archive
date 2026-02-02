"use client";
import Link from "next/link";
import React from "react";
import { IconType } from "react-icons";

interface props {
  icon?: IconType;
  size?: number;
  OnClick: () => void;
  label?: string;
  bgw?: boolean;
  bg?: boolean;
  disabled?: boolean;
  IsActive?: boolean;
  NoHover?: boolean
}
export default function IconButton(props: props) {
  const [IsMounted, setMounted] = React.useState<boolean>(false)

  React.useEffect(() => { setMounted(true) }, [])
  if (!IsMounted) return
  return (<button
    disabled={props.disabled}
    onClick={props.OnClick}
    className={`text-base p-3 ${!props.NoHover && 'hover:bg-LightBtnHover/50 dark:hover:bg-DarkBtnHover/50'} dark:text-white text-black  ${props.bg && ' text-LightBtnIsActive dark:text-DarkBtnIsActive'} ${props.IsActive && ' bg-LightBtnIsActive dark:bg-DarkBtnIsActive'} rounded-full ${props.bgw && 'bg-white '}`}
  >
    {props.icon && <props.icon className={`text-black ${props.IsActive && 'text-black '} z-B1`} size={props.size ? props.size : 21} />}
    {props.label && (
      <h5 className={` capitalize w-max `}>{props.label}</h5>
    )}
  </button>

  );
}
