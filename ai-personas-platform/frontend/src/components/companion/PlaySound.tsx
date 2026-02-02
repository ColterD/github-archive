import React, { use } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import WaveSurfer from "wavesurfer.js";
import { FaPlayCircle } from "react-icons/fa";
import {FaPauseCircle} from "react-icons/fa";


type WaveSurferOptions = {
  container: string | HTMLElement;
  waveColor: string;
  progressColor: string;
  cursorColor: string;
  barWidth: number;
  barRadius: number;
  responsive: boolean;
  height: number| "auto";
  partialRender: boolean;
  justify: string;
};



interface PlaySoundProps {
    soundPath: string;
}

export default function PlaySound({soundPath}: PlaySoundProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const globalRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const [continerSize, setContinerSize] = useState({width: 0, height: 0});

  let formWaveSurferOptions = (ref: React.RefObject<HTMLDivElement>): WaveSurferOptions => ({
    container: ref.current!,
    waveColor: "#ECD7FE",
    progressColor: "#C16CFF",
    cursorColor: "#ffffff00",
    barWidth: 4,
    barRadius: 3,
    responsive: false,
    height: "auto",
    partialRender: true,
    justify: "center"
  });

  const create = async () => {
    wavesurfer.current = WaveSurfer.create(formWaveSurferOptions(waveformRef));
    await wavesurfer.current.load(soundPath);
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  useEffect(() => {
    setIsMounted(() => true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    create();
    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    }
  }, [isMounted]);

  return (
    <div className=" flex w-full h-full" ref={globalRef}>
        <div className={`w-1/8 h-full pr-2 flex justify-center text-4xl items-center text-[#C16CFF] ${playing ? 'text-[#C16CFF]' : 'text-[#ECD7FE]'} cursor-pointer`} onClick={handlePlayPause}>{!playing ? <FaPlayCircle/> : <FaPauseCircle/>}</div>
      <div id="waveform" ref={waveformRef} className="w-full h-full" />
    </div>
  );
}