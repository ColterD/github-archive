interface LightProps {
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
    hidden?: boolean;
    mobilehidden?: boolean;
}

export default function Light({top, left, right, bottom, hidden, mobilehidden}: LightProps) {
    return (
        <div className={`relative w-full z-0 ${mobilehidden ? 'hidden md:inline' : ''} ${hidden ? 'md:hidden' : ''}`}>
    <div className={`shadowbg absolute w-[340px]  ${right != undefined ? `right-${right}` : ''} ${left != undefined ? `left-${left}` : ''} ${top != undefined ? `top-[${top}px]` : ''} ${bottom != undefined ? `bottom-[${bottom}px]` : ''} `}>
      <div className="absolute w-[230px] h-[230px]  rounded-full  bg-yellow-500/80 blur-3xl right-1 "></div>

      <div className="absolute w-[230px] h-[230px] rounded-full bg-white/70 blur-3xl left-1 "></div>
    </div>
    </div>
    )
}